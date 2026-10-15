"""
Training Runner: Multimodal Concatenation Fusion Baseline — MindSense Phase 7 Step 1

Trains the concatenation baseline under the exact same experimental conditions as E04:
- Identical Phase 2 pretrained unimodal encoder checkpoints
- Strictly frozen unimodal backbones
- Identical MELD train/val split and sample filtering
- Identical random seed (42)
- Identical class weights computed ONLY from train split
- Identical optimizer (AdamW, lr=1e-3, weight_decay=1e-4)
- Identical batch size (32), max epochs (15), and early stopping patience (4)
- Model selection based strictly on Validation Macro-F1
- Test set remains strictly UNTOUCHED during training
"""

import os
import json
import time
import argparse
from pathlib import Path
from typing import Dict, Any, Optional, Union
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from ..data.manifest import DatasetManifest
from ..data.dataset import MultimodalEmotionDataset, multimodal_collate_fn
from ..data.preprocessing import DatasetPreprocessor
from ..baselines.common import compute_class_weights_from_train, filter_valid_multimodal_records
from ..baselines.metrics import compute_comprehensive_metrics
from ..data.label_mapping import STANDARD_EMOTIONS, LABEL_TO_ID
from .config import (
    DATA_MANIFEST_PATH, REPO_ROOT, PRETRAINED_CHECKPOINTS, RANDOM_SEED,
    EPOCHS, BATCH_SIZE, LEARNING_RATE, WEIGHT_DECAY, EARLY_STOPPING_PATIENCE,
    NUM_CLASSES, get_device, set_seed
)
from .concat_model import MultimodalConcatenationFusion

DEFAULT_CONCAT_ARTIFACTS_DIR = REPO_ROOT / "artifacts" / "fusion_ablation" / "concat"


def run_concat_training(
    manifest_path: Path = DATA_MANIFEST_PATH,
    epochs: int = EPOCHS,
    batch_size: int = BATCH_SIZE,
    learning_rate: float = LEARNING_RATE,
    weight_decay: float = WEIGHT_DECAY,
    patience: int = EARLY_STOPPING_PATIENCE,
    freeze_backbones: bool = True,
    pretrained_checkpoints: Optional[Dict[str, Union[str, Path]]] = None,
    resume_from: Optional[Union[str, Path]] = None,
    experiment_id: str = "E06_Fusion_Ablation_Concatenation",
    output_dir: Optional[Path] = None,
    seed: int = RANDOM_SEED
) -> Dict[str, Any]:
    """
    Executes training loop for Multimodal Concatenation Fusion Baseline.
    Selects best checkpoint using Validation Macro-F1.
    Test set remains strictly UNTOUCHED during training.
    """
    set_seed(seed)
    device = get_device()
    if output_dir is None:
        output_dir = DEFAULT_CONCAT_ARTIFACTS_DIR
    output_dir = Path(output_dir)

    ckpt_dir = output_dir / "checkpoints"
    hist_dir = output_dir / "training_history"
    cfg_dir = output_dir / "configuration"

    for d in [output_dir, ckpt_dir, hist_dir, cfg_dir]:
        d.mkdir(parents=True, exist_ok=True)

    if resume_from is not None:
        resume_path = Path(resume_from)
        if not resume_path.exists():
            raise FileNotFoundError(f"Checkpoint file not found for resume: {resume_path}")

    print("\n" + "=" * 75)
    print(f"RUNNING CONCATENATION FUSION TRAINING — {experiment_id}")
    print("=" * 75)
    print(f"Device:                 {device}")
    print(f"Manifest Path:          {manifest_path}")
    print(f"Output Directory:       {output_dir}")
    print(f"Freeze Backbones:       {freeze_backbones}")
    print(f"Epochs Target:          {epochs}")
    print(f"Batch Size:             {batch_size}")
    print(f"Learning Rate:          {learning_rate}")
    print(f"Weight Decay:           {weight_decay}")
    print(f"Patience:               {patience}")
    print(f"Seed:                   {seed}")

    # 1. Load Manifest & Partition Train/Val Splits with Verified Multimodal Validation
    manifest = DatasetManifest.load_json(manifest_path)
    raw_train = manifest.filter_by_split("train")
    raw_val = manifest.filter_by_split("val")

    train_records, train_excl = filter_valid_multimodal_records(raw_train)
    val_records, val_excl = filter_valid_multimodal_records(raw_val)

    print(f"Train samples:          {len(train_records)} (Excluded missing/invalid: {train_excl})")
    print(f"Val samples:            {len(val_records)} (Excluded missing/invalid: {val_excl})")

    # 2. Datasets & DataLoaders
    preprocessor = DatasetPreprocessor(strict_paths=True)
    train_ds = MultimodalEmotionDataset(train_records, preprocessor=preprocessor)
    val_ds = MultimodalEmotionDataset(val_records, preprocessor=preprocessor)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, collate_fn=multimodal_collate_fn)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, collate_fn=multimodal_collate_fn)

    # 3. Class Weights Derived ONLY from Train Split
    class_weights = compute_class_weights_from_train(train_records).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # 4. Model Initialization & Backbone Pretraining Loading
    model = MultimodalConcatenationFusion(num_classes=NUM_CLASSES).to(device)
    load_status = model.load_pretrained_backbones(
        checkpoint_paths=pretrained_checkpoints or PRETRAINED_CHECKPOINTS,
        freeze=freeze_backbones,
        map_location=device
    )
    print(f"Pretrained Backbones Loaded: {load_status}")

    param_counts = model.get_parameter_counts()
    print(f"Parameter Counts: Total={param_counts['total']}, Trainable={param_counts['trainable']}, Frozen={param_counts['frozen']}")

    # 5. Optimizer (Only optimize trainable parameters)
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(trainable_params, lr=learning_rate, weight_decay=weight_decay)

    start_epoch = 1
    best_val_macro_f1 = -1.0
    best_epoch = 0
    patience_counter = 0
    training_history = []
    start_time = time.time()

    best_model_path = ckpt_dir / "best_model.pt"
    root_best_model_path = output_dir / "best_model.pt"

    # Resume Checkpoint Support
    if resume_from is not None:
        resume_path = Path(resume_from)
        print(f"\n[RESUME] Loading checkpoint from: {resume_path}")
        checkpoint = torch.load(resume_path, map_location=device, weights_only=True)
        model.load_state_dict(checkpoint["model_state_dict"])
        if "optimizer_state_dict" in checkpoint and checkpoint["optimizer_state_dict"] is not None:
            try:
                optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
            except Exception as e:
                print(f"[RESUME WARNING] Could not fully restore optimizer state: {e}")

        best_epoch = checkpoint.get("epoch", 0)
        start_epoch = best_epoch + 1
        best_val_macro_f1 = checkpoint.get("val_macro_f1", -1.0)

        hist_path = hist_dir / "training_history.json"
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

    # 6. Training Loop
    for epoch in range(start_epoch, epochs + 1):
        model.train()
        train_loss_sum = 0.0
        train_count = 0

        for batch in train_loader:
            text_in = batch["text"].to(device)
            audio_in = batch["audio"].to(device)
            vision_in = batch["vision"].to(device)
            mask_in = batch["modality_mask"].to(device)
            y_target = batch["label"].to(device)

            optimizer.zero_grad()
            outputs = model(text=text_in, audio=audio_in, vision=vision_in, modality_mask=mask_in)
            loss = criterion(outputs["logits"], y_target)
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
                text_in = batch["text"].to(device)
                audio_in = batch["audio"].to(device)
                vision_in = batch["vision"].to(device)
                mask_in = batch["modality_mask"].to(device)
                y_target = batch["label"].to(device)

                outputs = model(text=text_in, audio=audio_in, vision=vision_in, modality_mask=mask_in)
                loss = criterion(outputs["logits"], y_target)

                val_loss_sum += loss.item() * len(y_target)
                val_count += len(y_target)

                preds = torch.argmax(outputs["logits"], dim=1).cpu().numpy().tolist()
                targets = y_target.cpu().numpy().tolist()

                val_preds.extend(preds)
                val_targets.extend(targets)

        avg_val_loss = val_loss_sum / val_count if val_count > 0 else 0.0
        val_metrics = compute_comprehensive_metrics(
            val_targets, val_preds, class_names=STANDARD_EMOTIONS
        )

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

            checkpoint_data = {
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_macro_f1": val_macro_f1,
                "config": {
                    "experiment_id": experiment_id,
                    "fusion_method": "concatenation",
                    "freeze_backbones": freeze_backbones,
                    "seed": seed,
                    "d_model": model.d_model,
                    "num_classes": model.num_classes,
                    "param_counts": param_counts
                }
            }
            torch.save(checkpoint_data, best_model_path)
            if root_best_model_path != best_model_path:
                torch.save(checkpoint_data, root_best_model_path)

            print(f"  --> Saved new best concatenation checkpoint at epoch {epoch} (Val Macro-F1: {val_macro_f1:.4f})", flush=True)
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\n[EARLY STOPPING] Triggered at epoch {epoch} (Patience: {patience}). Best epoch was {best_epoch}.", flush=True)
                break

    end_time = time.time()
    elapsed_sec = round(end_time - start_time, 2)

    # Save Experiment Config & Training History
    exp_config = {
        "experiment_id": experiment_id,
        "fusion_method": "concatenation",
        "modality": "multimodal_fusion",
        "dataset": "MELD",
        "seed": seed,
        "epochs_target": epochs,
        "epochs_trained": len(training_history),
        "best_epoch": best_epoch,
        "freeze_backbones": freeze_backbones,
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
        "parameter_counts": param_counts,
        "excluded_samples": {"train": train_excl, "val": val_excl}
    }

    with open(cfg_dir / "config.json", "w", encoding="utf-8") as f:
        json.dump(exp_config, f, indent=2)
    with open(output_dir / "config.json", "w", encoding="utf-8") as f:
        json.dump(exp_config, f, indent=2)

    with open(hist_dir / "training_history.json", "w", encoding="utf-8") as f:
        json.dump(training_history, f, indent=2)
    with open(output_dir / "training_history.json", "w", encoding="utf-8") as f:
        json.dump(training_history, f, indent=2)

    print("-" * 75)
    print("CONCATENATION FUSION TRAINING COMPLETE")
    print(f"Best Epoch:           {best_epoch}")
    print(f"Best Val Macro-F1:    {best_val_macro_f1:.4f}")
    print(f"Duration:             {elapsed_sec}s")
    print("=" * 75)

    return exp_config


def main():
    parser = argparse.ArgumentParser(description="MindSense Phase 7 Multimodal Concatenation Training Runner")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--weight-decay", type=float, default=1e-4, help="Weight decay")
    parser.add_argument("--patience", type=int, default=4, help="Early stopping patience")
    parser.add_argument("--freeze-backbones", action="store_true", default=True, help="Freeze pretrained unimodal backbones (default)")
    parser.add_argument("--resume-from", type=str, default=None, help="Path to checkpoint to resume training from")
    parser.add_argument("--experiment-id", type=str, default="E06_Fusion_Ablation_Concatenation", help="Experiment identifier")
    parser.add_argument("--output-dir", type=str, default=None, help="Output directory path")
    args = parser.parse_args()

    run_concat_training(
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        weight_decay=args.weight_decay,
        patience=args.patience,
        freeze_backbones=args.freeze_backbones,
        resume_from=args.resume_from,
        experiment_id=args.experiment_id,
        output_dir=Path(args.output_dir) if args.output_dir else None
    )


if __name__ == "__main__":
    main()
