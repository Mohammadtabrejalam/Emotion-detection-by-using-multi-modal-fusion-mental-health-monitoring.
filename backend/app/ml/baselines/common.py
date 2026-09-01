"""
Common Training Loop, Dataset Filtering & Class Weight Computation — MindSense
"""

import os
import json
import time
import torch
import numpy as np
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import List, Dict, Any, Tuple, Optional, Type, Union
from pathlib import Path

from ..data.manifest import DatasetManifest, SampleRecord
from ..data.dataset import MultimodalEmotionDataset, multimodal_collate_fn
from ..data.preprocessing import DatasetPreprocessor
from .config import (
    DATA_MANIFEST_PATH, ARTIFACTS_DIR, RANDOM_SEED, EPOCHS, BATCH_SIZE,
    LEARNING_RATE, WEIGHT_DECAY, EARLY_STOPPING_PATIENCE, EMOTION_CLASSES,
    NUM_CLASSES, get_device, set_seed
)
from .metrics import compute_comprehensive_metrics


def filter_valid_unimodal_records(
    records: List[SampleRecord],
    modality: str
) -> Tuple[List[SampleRecord], int]:
    """
    Filters dataset records ensuring the target modality is present and valid.
    Rejects missing inputs with explicit accounting (no silent zero padding).
    """
    modality = modality.lower()
    valid_records = []
    excluded_count = 0

    for r in records:
        if modality == "text":
            if r.has_text and r.text_content and r.text_content.strip():
                valid_records.append(r)
            else:
                excluded_count += 1
        elif modality == "audio":
            if r.has_audio and r.audio_path:
                p = Path(r.audio_path)
                if p.exists() and p.stat().st_size >= 128:
                    try:
                        with open(p, "rb") as f:
                            hdr = f.read(32)
                        if not hdr.startswith(b"\x00" * 8):
                            valid_records.append(r)
                        else:
                            excluded_count += 1
                    except Exception:
                        excluded_count += 1
                else:
                    excluded_count += 1
            else:
                excluded_count += 1
        elif modality == "vision":
            if r.has_vision and r.video_path:
                p = Path(r.video_path)
                if p.exists() and p.stat().st_size >= 128:
                    try:
                        with open(p, "rb") as f:
                            hdr = f.read(32)
                        if not hdr.startswith(b"\x00" * 8):
                            valid_records.append(r)
                        else:
                            excluded_count += 1
                    except Exception:
                        excluded_count += 1
                else:
                    excluded_count += 1
            else:
                excluded_count += 1
        else:
            raise ValueError(f"Unsupported modality: '{modality}'")

    return valid_records, excluded_count


def compute_class_weights_from_train(
    train_records: List[SampleRecord],
    num_classes: int = NUM_CLASSES
) -> torch.Tensor:
    """
    Computes CrossEntropyLoss class weights ONLY from the training split records.
    Uses inverse frequency formula: W_c = Total_Samples / (Num_Classes * Count_c)
    """
    counts = np.zeros(num_classes, dtype=np.int64)
    for r in train_records:
        if 0 <= r.label_id < num_classes:
            counts[r.label_id] += 1

    total_samples = len(train_records)
    weights = np.zeros(num_classes, dtype=np.float32)

    for i in range(num_classes):
        if counts[i] > 0:
            weights[i] = total_samples / (num_classes * counts[i])
        else:
            weights[i] = 1.0

    # Normalize weights so mean weight is 1.0
    weights = weights / np.mean(weights)
    print(f"[CLASS WEIGHTS] Computed train-only weights: {dict(zip(EMOTION_CLASSES, [round(w, 4) for w in weights]))}")
    return torch.tensor(weights, dtype=torch.float32)


def run_unimodal_training(
    modality: str,
    model_cls: Type[nn.Module],
    model_kwargs: Dict[str, Any],
    experiment_id: str,
    manifest_path: Path = DATA_MANIFEST_PATH,
    epochs: int = EPOCHS,
    batch_size: int = BATCH_SIZE,
    learning_rate: float = LEARNING_RATE,
    weight_decay: float = WEIGHT_DECAY,
    patience: int = EARLY_STOPPING_PATIENCE,
    seed: int = RANDOM_SEED,
    resume_from: Optional[Union[str, Path]] = None,
    output_dir: Optional[Path] = None
) -> Dict[str, Any]:
    """
    Common training loop for unimodal baselines (Text, Audio, Vision).
    Selects best checkpoint using Validation Macro-F1.
    Test set remains UNTOUCHED during training.
    """
    set_seed(seed)
    device = get_device()
    if output_dir is None:
        output_dir = ARTIFACTS_DIR / modality
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if resume_from is not None:
        resume_path = Path(resume_from)
        if not resume_path.exists():
            raise FileNotFoundError(f"Checkpoint file not found for resume: {resume_path}")

    print("\n" + "=" * 75)
    print(f"RUNNING UNIMODAL BASELINE TRAINING — {modality.upper()} ({experiment_id})")
    print("=" * 75)
    print(f"Device:               {device}")
    print(f"Manifest Path:        {manifest_path}")
    print(f"Output Directory:     {output_dir}")

    # Load Manifest & Partition Splits
    manifest = DatasetManifest.load_json(manifest_path)
    raw_train = manifest.filter_by_split("train")
    raw_val = manifest.filter_by_split("val")

    train_records, train_excl = filter_valid_unimodal_records(raw_train, modality)
    val_records, val_excl = filter_valid_unimodal_records(raw_val, modality)

    print(f"Train samples ({modality}): {len(train_records)} (Excluded missing/invalid: {train_excl})")
    print(f"Val samples ({modality}):   {len(val_records)} (Excluded missing/invalid: {val_excl})")

    # Datasets & DataLoaders (only process target modality, strict validation)
    preprocessor = DatasetPreprocessor(strict_paths=True)
    train_ds = MultimodalEmotionDataset(train_records, active_modalities=[modality], preprocessor=preprocessor)
    val_ds = MultimodalEmotionDataset(val_records, active_modalities=[modality], preprocessor=preprocessor)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, collate_fn=multimodal_collate_fn)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, collate_fn=multimodal_collate_fn)

    # Class Weights derived ONLY from Train
    class_weights = compute_class_weights_from_train(train_records).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Model & Optimizer
    model = model_cls(**model_kwargs).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)

    start_epoch = 1
    best_val_macro_f1 = -1.0
    best_epoch = 0
    patience_counter = 0
    training_history = []
    start_time = time.time()

    best_model_path = output_dir / "best_model.pt"

    if resume_from is not None:
        resume_path = Path(resume_from)
        if not resume_path.exists():
            raise FileNotFoundError(f"Checkpoint file not found for resume: {resume_path}")

        print(f"\n[RESUME] Loading checkpoint from: {resume_path}")
        checkpoint = torch.load(resume_path, map_location=device)
        model.load_state_dict(checkpoint["model_state_dict"])
        if "optimizer_state_dict" in checkpoint and checkpoint["optimizer_state_dict"] is not None:
            optimizer.load_state_dict(checkpoint["optimizer_state_dict"])

        best_epoch = checkpoint.get("epoch", 0)
        start_epoch = best_epoch + 1
        best_val_macro_f1 = checkpoint.get("val_macro_f1", -1.0)

        # Restore previous training history if available
        hist_path = output_dir / "training_history.json"
        if hist_path.exists():
            try:
                with open(hist_path, "r", encoding="utf-8") as f:
                    prev_hist = json.load(f)
                    if isinstance(prev_hist, list):
                        training_history = [h for h in prev_hist if h.get("epoch", 0) < start_epoch]
            except Exception:
                training_history = []

        print(f"[RESUME] Restored state from epoch {best_epoch} (Best Val Macro-F1: {best_val_macro_f1:.4f})")
        print(f"[RESUME] Resuming training from epoch {start_epoch} through target {epochs}...\n")

    for epoch in range(start_epoch, epochs + 1):
        # Training Phase
        model.train()
        train_loss_sum = 0.0
        train_count = 0

        for batch in train_loader:
            x_input = batch[modality].to(device)
            y_target = batch["label"].to(device)

            optimizer.zero_grad()
            _, logits = model(x_input)
            loss = criterion(logits, y_target)
            loss.backward()
            optimizer.step()

            train_loss_sum += loss.item() * len(y_target)
            train_count += len(y_target)

        avg_train_loss = train_loss_sum / train_count if train_count > 0 else 0.0

        # Validation Phase
        model.eval()
        val_loss_sum = 0.0
        val_count = 0
        val_preds = []
        val_targets = []

        with torch.no_grad():
            for batch in val_loader:
                x_input = batch[modality].to(device)
                y_target = batch["label"].to(device)

                _, logits = model(x_input)
                loss = criterion(logits, y_target)

                val_loss_sum += loss.item() * len(y_target)
                val_count += len(y_target)

                preds = torch.argmax(logits, dim=1).cpu().numpy().tolist()
                targets = y_target.cpu().numpy().tolist()

                val_preds.extend(preds)
                val_targets.extend(targets)

        avg_val_loss = val_loss_sum / val_count if val_count > 0 else 0.0
        val_metrics = compute_comprehensive_metrics(val_targets, val_preds)

        val_acc = val_metrics["accuracy"]
        val_macro_f1 = val_metrics["macro_f1"]

        history_entry = {
            "epoch": epoch,
            "train_loss": round(avg_train_loss, 4),
            "val_loss": round(avg_val_loss, 4),
            "val_accuracy": val_acc,
            "val_macro_f1": val_macro_f1
        }
        training_history.append(history_entry)

        print(f"Epoch {epoch:2d}/{epochs} | Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} | Val Acc: {val_acc:.4f} | Val Macro-F1: {val_macro_f1:.4f}", flush=True)

        # Checkpoint Selection on Validation Macro-F1
        if val_macro_f1 > best_val_macro_f1:
            best_val_macro_f1 = val_macro_f1
            best_epoch = epoch
            patience_counter = 0

            # Save Checkpoint
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_macro_f1": val_macro_f1,
                "config": {
                    "modality": modality,
                    "experiment_id": experiment_id,
                    "model_kwargs": model_kwargs,
                    "seed": seed
                }
            }, best_model_path)
            print(f"  --> Saved new best checkpoint at epoch {epoch} (Val Macro-F1: {val_macro_f1:.4f})", flush=True)
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\n[EARLY STOPPING] Triggered at epoch {epoch} (Patience: {patience}). Best epoch was {best_epoch}.", flush=True)
                break

    end_time = time.time()
    elapsed_sec = round(end_time - start_time, 2)

    # Save Experiment Config & History
    exp_config = {
        "experiment_id": experiment_id,
        "modality": modality,
        "dataset": "MELD",
        "seed": seed,
        "epochs_trained": len(training_history),
        "best_epoch": best_epoch,
        "resumed_from": str(resume_from) if resume_from else None,
        "batch_size": batch_size,
        "learning_rate": learning_rate,
        "weight_decay": weight_decay,
        "optimizer": "AdamW",
        "loss": "CrossEntropyLoss (Train Weighted)",
        "class_weights": class_weights.cpu().numpy().tolist(),
        "device": str(device),
        "best_val_macro_f1": best_val_macro_f1,
        "training_duration_sec": elapsed_sec,
        "excluded_samples": {"train": train_excl, "val": val_excl}
    }

    with open(output_dir / "config.json", "w", encoding="utf-8") as f:
        json.dump(exp_config, f, indent=2)

    with open(output_dir / "training_history.json", "w", encoding="utf-8") as f:
        json.dump(training_history, f, indent=2)

    print("-" * 75)
    print(f"TRAINING COMPLETE — {modality.upper()}")
    print(f"Best Epoch:           {best_epoch}")
    print(f"Best Val Macro-F1:    {best_val_macro_f1:.4f}")
    print(f"Duration:             {elapsed_sec}s")
    print("=" * 75)

    return exp_config
