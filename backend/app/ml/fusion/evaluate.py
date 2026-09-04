"""
CLI Evaluator: Multimodal Fusion Test Set Evaluation — MindSense Phase 3
Usage:
    python -m backend.app.ml.fusion.evaluate
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, Optional
import torch
from torch.utils.data import DataLoader

from ..data.manifest import DatasetManifest
from ..data.dataset import MultimodalEmotionDataset, multimodal_collate_fn
from ..data.preprocessing import DatasetPreprocessor
from ..baselines.common import filter_valid_multimodal_records
from ..baselines.metrics import compute_comprehensive_metrics
from .config import (
    DATA_MANIFEST_PATH, ARTIFACTS_DIR, CHECKPOINTS_DIR, METRICS_DIR,
    CONFUSION_MATRICES_DIR, FULL_FUSION_DIR, EMOTION_CLASSES, NUM_CLASSES,
    get_device
)
from .model import MultimodalFusionTransformer


def evaluate_fusion_model(
    checkpoint_path: Optional[Path] = None,
    manifest_path: Path = DATA_MANIFEST_PATH,
    output_dir: Optional[Path] = None,
    batch_size: int = 32
) -> Dict[str, Any]:
    """
    Evaluates trained Multimodal Fusion Transformer on held-out test split.
    Test set is evaluated ONLY after training is complete.
    """
    if checkpoint_path is None:
        checkpoint_path = CHECKPOINTS_DIR / "best_model.pt"
        if not checkpoint_path.exists():
            checkpoint_path = ARTIFACTS_DIR / "best_model.pt"

    checkpoint_path = Path(checkpoint_path)
    if not checkpoint_path.exists():
        print(f"\n[ERROR] Fusion checkpoint not found: {checkpoint_path}")
        print("Please train the model first: python -m backend.app.ml.fusion.train")
        sys.exit(1)

    if output_dir is None:
        output_dir = ARTIFACTS_DIR
    output_dir = Path(output_dir)

    metrics_dir = output_dir / "metrics"
    conf_dir = output_dir / "confusion_matrices"
    full_dir = output_dir / "full"

    for d in [output_dir, metrics_dir, conf_dir, full_dir]:
        d.mkdir(parents=True, exist_ok=True)

    print("=" * 75)
    print("EVALUATING TEST SET — MULTIMODAL FUSION TRANSFORMER")
    print("=" * 75)
    print(f"Checkpoint Path: {checkpoint_path}")
    print(f"Manifest Path:   {manifest_path}")
    print(f"Output Dir:      {output_dir}")

    device = get_device()
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
    config = checkpoint.get("config", {})

    # Instantiate and load model
    model = MultimodalFusionTransformer(
        num_classes=config.get("num_classes", NUM_CLASSES),
        d_model=config.get("d_model", 64),
        nhead=config.get("nhead", 4)
    ).to(device)

    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Load Test Split with verified multimodal filtering
    manifest = DatasetManifest.load_json(manifest_path)
    raw_test = manifest.filter_by_split("test")
    test_records, test_excl = filter_valid_multimodal_records(raw_test)
    print(f"Loaded {len(test_records)} valid held-out test records ({test_excl} excluded missing/invalid).")

    preprocessor = DatasetPreprocessor(strict_paths=True)
    test_ds = MultimodalEmotionDataset(test_records, preprocessor=preprocessor)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, collate_fn=multimodal_collate_fn)

    test_preds = []
    test_targets = []

    with torch.no_grad():
        for batch in test_loader:
            text_in = batch["text"].to(device)
            audio_in = batch["audio"].to(device)
            vision_in = batch["vision"].to(device)
            mask_in = batch["modality_mask"].to(device)
            y_target = batch["label"].to(device)

            outputs = model(text=text_in, audio=audio_in, vision=vision_in, modality_mask=mask_in)
            preds = torch.argmax(outputs["logits"], dim=1).cpu().numpy().tolist()
            targets = y_target.cpu().numpy().tolist()

            test_preds.extend(preds)
            test_targets.extend(targets)

    # Compute Comprehensive Metrics
    metrics = compute_comprehensive_metrics(test_targets, test_preds)
    metrics["model_type"] = "Multimodal_Fusion_Transformer"
    metrics["checkpoint_epoch"] = checkpoint.get("epoch")
    metrics["val_macro_f1_checkpoint"] = checkpoint.get("val_macro_f1")
    metrics["freeze_backbones"] = config.get("freeze_backbones", True)

    # Save metrics and confusion matrix artifacts
    with open(metrics_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    with open(output_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    with open(full_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    conf_payload = {
        "classes": EMOTION_CLASSES,
        "confusion_matrix": metrics["confusion_matrix"]
    }
    with open(conf_dir / "confusion_matrix.json", "w", encoding="utf-8") as f:
        json.dump(conf_payload, f, indent=2)
    with open(output_dir / "confusion_matrix.json", "w", encoding="utf-8") as f:
        json.dump(conf_payload, f, indent=2)
    with open(full_dir / "confusion_matrix.json", "w", encoding="utf-8") as f:
        json.dump(conf_payload, f, indent=2)

    print("\n" + "-" * 75)
    print("TEST EVALUATION SUMMARY — MULTIMODAL FUSION")
    print("-" * 75)
    print(f"Test Accuracy:         {metrics['accuracy'] * 100:.2f}%")
    print(f"Test Macro-F1:         {metrics['macro_f1']:.4f}")
    print(f"Test Weighted-F1:      {metrics['weighted_f1']:.4f}")
    print(f"Test Macro-Precision:  {metrics['macro_precision']:.4f}")
    print(f"Test Macro-Recall:     {metrics['macro_recall']:.4f}")
    print(f"Test Samples:          {metrics['total_samples']}")
    print("\nPer-Class Results:")
    for cls_name, cls_m in metrics["per_class"].items():
        print(f"  - {cls_name:<10}: F1={cls_m['f1']:.4f} | Prec={cls_m['precision']:.4f} | Rec={cls_m['recall']:.4f} | Support={cls_m['support']}")
    print("=" * 75)

    return metrics


def main():
    parser = argparse.ArgumentParser(description="MindSense Phase 3 Multimodal Fusion Test Evaluator")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to best_model.pt checkpoint")
    parser.add_argument("--manifest", type=str, default=str(DATA_MANIFEST_PATH), help="Path to manifest JSON")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    args = parser.parse_args()

    evaluate_fusion_model(
        checkpoint_path=Path(args.checkpoint) if args.checkpoint else None,
        manifest_path=Path(args.manifest),
        batch_size=args.batch_size
    )


if __name__ == "__main__":
    main()
