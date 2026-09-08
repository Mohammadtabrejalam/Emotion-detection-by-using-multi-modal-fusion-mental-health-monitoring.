"""
Phase 6.5: RAVDESS Cross-Dataset Zero-Shot Evaluation
Frozen E04 Multimodal Fusion Model Evaluation on External RAVDESS Benchmark

Usage:
    python -m backend.app.ml.fusion.evaluate_ravdess [--batch-size 32]
"""

import os
import sys
import time
import json
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Tuple
from collections import Counter

import torch
from torch.utils.data import DataLoader

from backend.app.ml.fusion.model import MultimodalFusionTransformer
from backend.app.ml.data.manifest import DatasetManifest, SampleRecord
from backend.app.ml.data.dataset import MultimodalEmotionDataset, multimodal_collate_fn
from backend.app.ml.data.preprocessing import DatasetPreprocessor
from backend.app.ml.baselines.metrics import compute_comprehensive_metrics
from backend.app.ml.data.label_mapping import ID_TO_LABEL

# Base directories
BACKEND_DIR = Path(__file__).resolve().parents[3]
REPO_ROOT = BACKEND_DIR.parent

# 1. Exact Checkpoint Path (Locked — NO fallback)
E04_CHECKPOINT_PATH = (
    REPO_ROOT / "artifacts" / "E04_Multimodal_Fusion_Frozen" / "best_model.pt"
)

# 3. Exact RAVDESS Manifest Path (Locked — NO fallback)
RAVDESS_MANIFEST_PATH = (
    REPO_ROOT / "data" / "manifests" / "ravdess_manifest.json"
)

# Artifact output directory
OUTPUT_ARTIFACT_DIR = REPO_ROOT / "artifacts" / "generalization"
OUTPUT_ARTIFACT_PATH = OUTPUT_ARTIFACT_DIR / "ravdess_zero_shot_results.json"

# Project 7-Class Label Taxonomy (IDs 0..6)
PROJECT_LABEL_NAMES = [
    ID_TO_LABEL[0],  # "happy"    -> ID 0
    ID_TO_LABEL[1],  # "sad"      -> ID 1
    ID_TO_LABEL[2],  # "angry"    -> ID 2
    ID_TO_LABEL[3],  # "fear"     -> ID 3
    ID_TO_LABEL[4],  # "surprise" -> ID 4
    ID_TO_LABEL[5],  # "disgust"  -> ID 5
    ID_TO_LABEL[6],  # "neutral"  -> ID 6
]

# Locked E04 Training Metadata Contract
LOCKED_E04_CONFIG = {
    "experiment_id": "E04_Multimodal_Fusion_Frozen",
    "freeze_backbones": True,
    "seed": 42,
    "d_model": 64,
    "nhead": 4,
    "num_classes": 7
}


def compute_file_sha256(file_path: Path) -> str:
    """Computes SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192 * 1024):
            sha256.update(chunk)
    return sha256.hexdigest()


def validate_ravdess_manifest(manifest: DatasetManifest) -> None:
    """Strict pre-evaluation integrity audit verifying all 10 constraints."""
    records: List[SampleRecord] = manifest.records

    # 1. Exactly 1,248 records
    if len(records) != 1248:
        raise ValueError(f"Integrity check 1 failed: Expected exactly 1,248 records, got {len(records)}")

    # 2. Exactly 24 unique actors
    unique_actors = {r.speaker_id for r in records}
    if len(unique_actors) != 24:
        raise ValueError(f"Integrity check 2 failed: Expected exactly 24 unique actors, got {len(unique_actors)}")

    # 5. Label IDs are strictly {0, 1, 2, 3, 4, 5, 6}
    unique_label_ids = {r.label_id for r in records}
    if unique_label_ids != {0, 1, 2, 3, 4, 5, 6}:
        raise ValueError(f"Integrity check 5 failed: Expected unique label IDs {{0..6}}, got {unique_label_ids}")

    seen_sample_ids = set()
    for r in records:
        # 3. Every record has dataset == "ravdess"
        if r.dataset != "ravdess":
            raise ValueError(f"Integrity check 3 failed: Sample '{r.sample_id}' has dataset '{r.dataset}', expected 'ravdess'")

        # 4. Every record has split == "test"
        if r.split != "test":
            raise ValueError(f"Integrity check 4 failed: Sample '{r.sample_id}' has split '{r.split}', expected 'test'")

        # 5. Per-record label ID check
        if r.label_id not in (0, 1, 2, 3, 4, 5, 6):
            raise ValueError(f"Integrity check 5 failed: Invalid label ID {r.label_id} for sample '{r.sample_id}'")

        # 6. Zero calm records
        if str(r.original_label).strip() == "02" or r.label.strip().lower() == "calm":
            raise ValueError(f"Integrity check 6 failed: Calm trial detected in '{r.sample_id}'. Calm trials must be excluded.")

        # 7. Every record has has_text == False, has_audio == True, has_vision == True
        if r.has_text is not False:
            raise ValueError(f"Integrity check 7 failed: Sample '{r.sample_id}' has_text is not False")
        if r.has_audio is not True:
            raise ValueError(f"Integrity check 7 failed: Sample '{r.sample_id}' has_audio is not True")
        if r.has_vision is not True:
            raise ValueError(f"Integrity check 7 failed: Sample '{r.sample_id}' has_vision is not True")

        # 8. No duplicate sample IDs
        if r.sample_id in seen_sample_ids:
            raise ValueError(f"Integrity check 8 failed: Duplicate sample ID detected: '{r.sample_id}'")
        seen_sample_ids.add(r.sample_id)

        # 9. Every audio_path exists
        if not r.audio_path or not Path(r.audio_path).is_file():
            raise FileNotFoundError(f"Integrity check 9 failed: Missing audio file for '{r.sample_id}': {r.audio_path}")

        # 10. Every video_path exists
        if not r.video_path or not Path(r.video_path).is_file():
            raise FileNotFoundError(f"Integrity check 10 failed: Missing video file for '{r.sample_id}': {r.video_path}")


def load_locked_e04_model(device: torch.device) -> Tuple[MultimodalFusionTransformer, Dict[str, Any]]:
    """Loads locked E04 checkpoint, asserts exact architecture, and sets requires_grad=False."""
    resolved_ckpt = E04_CHECKPOINT_PATH.resolve()

    if not resolved_ckpt.is_file():
        raise FileNotFoundError(f"Locked E04 checkpoint not found: {resolved_ckpt}")

    if "E04_Multimodal_Fusion_Frozen" not in resolved_ckpt.parts:
        raise ValueError(f"Path violation: expected 'E04_Multimodal_Fusion_Frozen' in path, got {resolved_ckpt}")

    # Load with weights_only=True
    checkpoint = torch.load(resolved_ckpt, map_location=device, weights_only=True)
    if not isinstance(checkpoint, dict) or "model_state_dict" not in checkpoint:
        raise ValueError(f"Corrupt checkpoint payload in {resolved_ckpt}")

    config = checkpoint.get("config", {})

    # Explicit verification of all 6 locked parameters
    if config.get("experiment_id") != "E04_Multimodal_Fusion_Frozen":
        raise ValueError(f"Expected experiment_id == 'E04_Multimodal_Fusion_Frozen', got {config.get('experiment_id')!r}")
    if config.get("freeze_backbones") is not True:
        raise ValueError(f"Expected freeze_backbones == True, got {config.get('freeze_backbones')!r}")
    if config.get("seed") != 42:
        raise ValueError(f"Expected seed == 42, got {config.get('seed')!r}")
    if config.get("d_model") != 64:
        raise ValueError(f"Expected d_model == 64, got {config.get('d_model')!r}")
    if config.get("nhead") != 4:
        raise ValueError(f"Expected nhead == 4, got {config.get('nhead')!r}")
    if config.get("num_classes") != 7:
        raise ValueError(f"Expected num_classes == 7, got {config.get('num_classes')!r}")

    # Instantiate model strictly with locked architecture
    model = MultimodalFusionTransformer(
        num_classes=7,
        d_model=64,
        nhead=4
    ).to(device)

    model.load_state_dict(checkpoint["model_state_dict"])

    # Eval mode & freeze all parameters
    model.eval()
    for param in model.parameters():
        param.requires_grad = False

    return model, config


def run_evaluation(batch_size: int = 32) -> Dict[str, Any]:
    start_time = time.time()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Verify paths exist
    if not E04_CHECKPOINT_PATH.is_file():
        raise FileNotFoundError(f"Checkpoint not found: {E04_CHECKPOINT_PATH}")
    if not RAVDESS_MANIFEST_PATH.is_file():
        raise FileNotFoundError(f"Manifest not found: {RAVDESS_MANIFEST_PATH}")

    ckpt_sha256 = compute_file_sha256(E04_CHECKPOINT_PATH)

    # Load and validate manifest
    manifest = DatasetManifest.load_json(RAVDESS_MANIFEST_PATH.resolve())
    validate_ravdess_manifest(manifest)

    # Construct dataset
    preprocessor = DatasetPreprocessor(strict_paths=True)
    dataset = MultimodalEmotionDataset(manifest.records, preprocessor=preprocessor)
    if len(dataset) != 1248:
        raise ValueError(f"Dataset length mismatch: expected 1248, got {len(dataset)}")

    # Single-sample smoke check for mask
    initial_sample = dataset[0]
    initial_mask = initial_sample["modality_mask"].tolist()
    if initial_mask != [0.0, 1.0, 1.0]:
        raise ValueError(f"Initial sample mask violation: expected [0.0, 1.0, 1.0], got {initial_mask}")

    # Load model
    model, ckpt_config = load_locked_e04_model(device)

    # Print / Record Pre-Run Execution Information
    print("================================================================================")
    print("  PHASE 6.5: RAVDESS ZERO-SHOT EVALUATION (PRE-RUN AUDIT)")
    print("================================================================================")
    print(f"1.  Checkpoint Path:      {E04_CHECKPOINT_PATH.resolve()}")
    print(f"2.  Checkpoint SHA256:    {ckpt_sha256}")
    print(f"3.  Manifest Path:        {RAVDESS_MANIFEST_PATH.resolve()}")
    print(f"4.  Manifest Record Count:{len(manifest.records)}")
    print(f"5.  Dataset Count:        {len(dataset)}")
    print(f"6.  Device:               {device}")
    print(f"7.  Batch Size:           {batch_size}")
    print(f"8.  Confirm Mask:         [0, 1, 1] (Verified: {initial_mask})")
    print(f"9.  Experiment ID:        E06_RAVDESS_Zero_Shot")
    print(f"10. Execution Protocol:   STRICT ZERO-SHOT (No training, no tuning, no calibration)")
    print("================================================================================\n")

    # DataLoader with shuffle=False
    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=False,
        collate_fn=multimodal_collate_fn
    )

    all_predictions: List[int] = []
    all_targets: List[int] = []
    num_batches = 0
    preprocessing_failures = 0
    skipped_samples = 0

    # Inference Loop
    with torch.inference_mode():
        for batch in dataloader:
            num_batches += 1
            text = batch["text"].to(device)
            audio = batch["audio"].to(device)
            vision = batch["vision"].to(device)
            modality_mask = batch["modality_mask"].to(device)
            labels = batch["label"].to(device)

            # Runtime batch mask assertion: strictly [0, 1, 1]
            expected_mask = torch.tensor([0.0, 1.0, 1.0], device=device).expand_as(modality_mask)
            if not torch.equal(modality_mask, expected_mask):
                raise ValueError(f"Batch {num_batches} modality mask violation! Got:\n{modality_mask}")

            # Forward pass
            outputs = model(
                text=text,
                audio=audio,
                vision=vision,
                modality_mask=modality_mask
            )

            logits = outputs["logits"]

            # Pure argmax on raw logits — zero temperature calibration
            preds = torch.argmax(logits, dim=-1)

            all_predictions.extend(preds.cpu().tolist())
            all_targets.extend(labels.cpu().tolist())

    elapsed_time = time.time() - start_time

    # Verify exact accumulation
    if len(all_predictions) != 1248 or len(all_targets) != 1248:
        raise ValueError(
            f"Accumulation count mismatch: expected 1248, got preds={len(all_predictions)}, targets={len(all_targets)}"
        )

    # Metrics computation
    metrics = compute_comprehensive_metrics(
        y_true=all_targets,
        y_pred=all_predictions,
        class_names=PROJECT_LABEL_NAMES
    )

    # Class distributions
    pred_counts = Counter(all_predictions)
    true_counts = Counter(all_targets)

    pred_dist = {PROJECT_LABEL_NAMES[i]: int(pred_counts.get(i, 0)) for i in range(7)}
    true_dist = {PROJECT_LABEL_NAMES[i]: int(true_counts.get(i, 0)) for i in range(7)}

    # Build output artifact dictionary
    results_payload = {
        "experiment_id": "E06_RAVDESS_Zero_Shot",
        "dataset": "ravdess",
        "evaluation_protocol": "zero_shot_cross_dataset",
        "checkpoint_info": {
            "path": str(E04_CHECKPOINT_PATH.resolve()),
            "sha256": ckpt_sha256,
            "experiment_id": ckpt_config.get("experiment_id"),
            "freeze_backbones": ckpt_config.get("freeze_backbones"),
            "seed": ckpt_config.get("seed"),
            "d_model": ckpt_config.get("d_model"),
            "nhead": ckpt_config.get("nhead"),
            "num_classes": ckpt_config.get("num_classes")
        },
        "manifest_info": {
            "path": str(RAVDESS_MANIFEST_PATH.resolve()),
            "total_records": len(manifest.records),
            "actors_count": len({r.speaker_id for r in manifest.records})
        },
        "execution_summary": {
            "device": str(device),
            "batch_size": batch_size,
            "num_batches": num_batches,
            "total_evaluated_samples": len(all_targets),
            "preprocessing_failures": preprocessing_failures,
            "skipped_samples": skipped_samples,
            "elapsed_seconds": round(elapsed_time, 2)
        },
        "overall_metrics": {
            "accuracy": metrics["accuracy"],
            "macro_f1": metrics["macro_f1"],
            "weighted_f1": metrics["weighted_f1"],
            "macro_precision": metrics["macro_precision"],
            "macro_recall": metrics["macro_recall"]
        },
        "per_class_metrics": metrics["per_class"],
        "confusion_matrix": {
            "class_order": PROJECT_LABEL_NAMES,
            "matrix": metrics["confusion_matrix"]
        },
        "distributions": {
            "predicted_class_distribution": pred_dist,
            "true_class_distribution": true_dist
        }
    }

    # Save artifact
    OUTPUT_ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_ARTIFACT_PATH, "w", encoding="utf-8") as f:
        json.dump(results_payload, f, indent=2)

    return results_payload


def main():
    results = run_evaluation(batch_size=32)
    print("\n================================================================================")
    print("  PHASE 6.5: RAVDESS ZERO-SHOT EVALUATION RAW REPORT")
    print("================================================================================")
    print(f"1.  Total Evaluated Samples:      {results['execution_summary']['total_evaluated_samples']}")
    print(f"2.  Accuracy:                     {results['overall_metrics']['accuracy']}")
    print(f"3.  Macro-F1:                     {results['overall_metrics']['macro_f1']}")
    print(f"4.  Weighted-F1:                  {results['overall_metrics']['weighted_f1']}")
    print(f"5.  Macro Precision:              {results['overall_metrics']['macro_precision']}")
    print(f"6.  Macro Recall:                 {results['overall_metrics']['macro_recall']}")
    print(f"7.  Per-Class Metrics:")
    for cls_name, cls_data in results['per_class_metrics'].items():
        print(f"      • {cls_name:<10}: P={cls_data['precision']:.4f}, R={cls_data['recall']:.4f}, F1={cls_data['f1']:.4f}, Support={cls_data['support']}")
    print(f"8.  Confusion Matrix (Rows=True, Cols=Pred, Order={PROJECT_LABEL_NAMES}):")
    for row in results['confusion_matrix']['matrix']:
        print(f"      {row}")
    print(f"9.  Predicted-Class Distribution: {results['distributions']['predicted_class_distribution']}")
    print(f"10. True-Class Distribution:      {results['distributions']['true_class_distribution']}")
    print(f"11. Number of Batches:            {results['execution_summary']['num_batches']}")
    print(f"12. Preprocessing Failures:       {results['execution_summary']['preprocessing_failures']}")
    print(f"13. Skipped Samples:              {results['execution_summary']['skipped_samples']}")
    print(f"14. Runtime / Duration:           {results['execution_summary']['elapsed_seconds']}s")
    print(f"15. Output Artifact Path:         {OUTPUT_ARTIFACT_PATH.resolve()}")
    print("================================================================================\n")


if __name__ == "__main__":
    main()
