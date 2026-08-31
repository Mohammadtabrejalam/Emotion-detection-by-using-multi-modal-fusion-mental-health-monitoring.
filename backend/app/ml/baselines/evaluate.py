"""
CLI Evaluator: Unimodal Baseline Test Set Evaluation — MindSense Phase 2
Usage:
    python -m backend.app.ml.baselines.evaluate --modality text|audio|vision
"""

import sys
import json
import argparse
import torch
from pathlib import Path
from torch.utils.data import DataLoader

from ..text_encoder import TextEncoder
from ..audio_encoder import AudioEncoder
from ..vision_encoder import VisionEncoder
from ..data.manifest import DatasetManifest
from ..data.dataset import MultimodalEmotionDataset, multimodal_collate_fn
from .common import filter_valid_unimodal_records
from .config import DATA_MANIFEST_PATH, ARTIFACTS_DIR, get_device, EMOTION_CLASSES
from .metrics import compute_comprehensive_metrics


def evaluate_unimodal_baseline(modality: str, manifest_path: Path = DATA_MANIFEST_PATH) -> dict:
    modality = modality.lower()
    artifact_dir = ARTIFACTS_DIR / modality
    checkpoint_path = artifact_dir / "best_model.pt"

    print("=" * 75)
    print(f"EVALUATING TEST SET — UNIMODAL {modality.upper()} BASELINE")
    print("=" * 75)
    print(f"Checkpoint Path: {checkpoint_path}")
    print(f"Manifest Path:   {manifest_path}")

    if not checkpoint_path.exists():
        print(f"\n[ERROR] Checkpoint not found: {checkpoint_path}")
        print(f"Please run training first: python -m backend.app.ml.baselines.train_{modality}")
        sys.exit(1)

    device = get_device()
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    config = checkpoint.get("config", {})
    model_kwargs = config.get("model_kwargs", {})

    # Instantiate Model
    if modality == "text":
        model = TextEncoder(**model_kwargs)
    elif modality == "audio":
        model = AudioEncoder(**model_kwargs)
    elif modality == "vision":
        model = VisionEncoder(**model_kwargs)
    else:
        raise ValueError(f"Unsupported modality: '{modality}'")

    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    # Load Test Records
    manifest = DatasetManifest.load_json(manifest_path)
    raw_test = manifest.filter_by_split("test")
    test_records, test_excl = filter_valid_unimodal_records(raw_test, modality)

    print(f"Loaded {len(test_records)} valid test records ({test_excl} excluded missing/invalid).")

    test_ds = MultimodalEmotionDataset(test_records)
    test_loader = DataLoader(test_ds, batch_size=32, shuffle=False, collate_fn=multimodal_collate_fn)

    test_preds = []
    test_targets = []

    with torch.no_grad():
        for batch in test_loader:
            x_input = batch[modality].to(device)
            y_target = batch["label"].to(device)

            _, logits = model(x_input)
            preds = torch.argmax(logits, dim=1).cpu().numpy().tolist()
            targets = y_target.cpu().numpy().tolist()

            test_preds.extend(preds)
            test_targets.extend(targets)

    # Compute Comprehensive Metrics
    metrics = compute_comprehensive_metrics(test_targets, test_preds)
    metrics["modality"] = modality
    metrics["checkpoint_epoch"] = checkpoint.get("epoch")
    metrics["val_macro_f1_checkpoint"] = checkpoint.get("val_macro_f1")
    metrics["excluded_test_samples"] = test_excl

    # Save metrics.json and confusion_matrix.json
    with open(artifact_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    with open(artifact_dir / "confusion_matrix.json", "w", encoding="utf-8") as f:
        json.dump({
            "classes": EMOTION_CLASSES,
            "confusion_matrix": metrics["confusion_matrix"]
        }, f, indent=2)

    # Update baseline_comparison.json
    comparison_path = ARTIFACTS_DIR / "baseline_comparison.json"
    comparison = {}
    if comparison_path.exists():
        try:
            with open(comparison_path, "r", encoding="utf-8") as f:
                comparison = json.load(f)
        except Exception:
            comparison = {}

    comparison[modality] = {
        "accuracy": metrics["accuracy"],
        "macro_f1": metrics["macro_f1"],
        "weighted_f1": metrics["weighted_f1"],
        "macro_precision": metrics["macro_precision"],
        "macro_recall": metrics["macro_recall"],
        "test_samples": metrics["total_samples"]
    }

    with open(comparison_path, "w", encoding="utf-8") as f:
        json.dump(comparison, f, indent=2)

    print("\n" + "-" * 75)
    print(f"EVALUATION SUMMARY — {modality.upper()}")
    print("-" * 75)
    print(f"Test Accuracy:         {metrics['accuracy'] * 100:.2f}%")
    print(f"Test Macro-F1:         {metrics['macro_f1']:.4f}")
    print(f"Test Weighted-F1:      {metrics['weighted_f1']:.4f}")
    print(f"Test Macro-Precision:  {metrics['macro_precision']:.4f}")
    print(f"Test Macro-Recall:     {metrics['macro_recall']:.4f}")
    print("\nPer-Class Results:")
    for cls_name, cls_m in metrics["per_class"].items():
        print(f"  - {cls_name:<10}: F1={cls_m['f1']:.4f} | Prec={cls_m['precision']:.4f} | Rec={cls_m['recall']:.4f} | Support={cls_m['support']}")
    print("=" * 75)

    return metrics


def main():
    parser = argparse.ArgumentParser(description="MindSense Phase 2 Unimodal Baseline Test Evaluator")
    parser.add_argument(
        "--modality",
        type=str,
        required=True,
        choices=["text", "audio", "vision"],
        help="Target unimodal baseline modality to evaluate."
    )
    args = parser.parse_args()
    evaluate_unimodal_baseline(args.modality)


if __name__ == "__main__":
    main()
