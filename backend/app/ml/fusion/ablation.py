"""
Systematic Ablation Study Runner — MindSense Phase 3
Evaluates all 7 combinations of modalities (T, A, V, T+A, T+V, A+V, T+A+V).
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
    DATA_MANIFEST_PATH, ARTIFACTS_DIR, CHECKPOINTS_DIR, ABLATIONS_DIR,
    ABLATION_CONFIGS, NUM_CLASSES, get_device
)
from .model import MultimodalFusionTransformer


def run_ablation_study(
    checkpoint_path: Optional[Path] = None,
    manifest_path: Path = DATA_MANIFEST_PATH,
    split: str = "test",
    output_dir: Optional[Path] = None,
    batch_size: int = 32
) -> Dict[str, Any]:
    """
    Runs systematic evaluation across the 7 modality ablation configurations.
    Masked modalities have inputs zero-filled and modality_mask set to 0.0,
    ensuring cross-modal attention key_padding_mask isolates active modalities.
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
    ablations_dir = output_dir / "ablations"
    ablations_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 75)
    print(f"RUNNING SYSTEMATIC ABLATION STUDY (Split: {split.upper()})")
    print("=" * 75)
    print(f"Checkpoint Path: {checkpoint_path}")
    print(f"Manifest Path:   {manifest_path}")

    device = get_device()
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
    config = checkpoint.get("config", {})

    model = MultimodalFusionTransformer(
        num_classes=config.get("num_classes", NUM_CLASSES),
        d_model=config.get("d_model", 64),
        nhead=config.get("nhead", 4)
    ).to(device)

    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    manifest = DatasetManifest.load_json(manifest_path)
    raw_records = manifest.filter_by_split(split)
    records, excl_count = filter_valid_multimodal_records(raw_records)
    print(f"Loaded {len(records)} valid records for ablation ({excl_count} excluded missing/invalid).")
    preprocessor = DatasetPreprocessor(strict_paths=True)

    ablation_results = {}

    for code, cfg in ABLATION_CONFIGS.items():
        name = cfg["name"]
        masked = cfg["masked_modalities"]

        ds = MultimodalEmotionDataset(
            records,
            preprocessor=preprocessor,
            masked_modalities=masked
        )
        loader = DataLoader(ds, batch_size=batch_size, shuffle=False, collate_fn=multimodal_collate_fn)

        preds_list = []
        targets_list = []

        with torch.no_grad():
            for batch in loader:
                text_in = batch["text"].to(device)
                audio_in = batch["audio"].to(device)
                vision_in = batch["vision"].to(device)
                mask_in = batch["modality_mask"].to(device)
                y_target = batch["label"].to(device)

                outputs = model(text=text_in, audio=audio_in, vision=vision_in, modality_mask=mask_in)
                preds = torch.argmax(outputs["logits"], dim=1).cpu().numpy().tolist()
                targets = y_target.cpu().numpy().tolist()

                preds_list.extend(preds)
                targets_list.extend(targets)

        metrics = compute_comprehensive_metrics(targets_list, preds_list)

        ablation_results[code] = {
            "name": name,
            "masked_modalities": masked,
            "active_modalities": cfg["active_modalities"],
            "accuracy": metrics["accuracy"],
            "macro_f1": metrics["macro_f1"],
            "weighted_f1": metrics["weighted_f1"],
            "macro_precision": metrics["macro_precision"],
            "macro_recall": metrics["macro_recall"],
            "total_samples": metrics["total_samples"],
            "per_class": metrics["per_class"]
        }

    # Save Ablation Results
    final_payload = {
        "split_evaluated": split,
        "checkpoint_evaluated": str(checkpoint_path),
        "configurations": ablation_results
    }

    with open(ablations_dir / "ablation_results.json", "w", encoding="utf-8") as f:
        json.dump(final_payload, f, indent=2)
    with open(output_dir / "ablation_results.json", "w", encoding="utf-8") as f:
        json.dump(final_payload, f, indent=2)

    # Print Formatted Comparison Table
    print("\n" + "=" * 80)
    print(f"{'Config':<8} | {'Description':<30} | {'Accuracy':<10} | {'Macro-F1':<10} | {'Weighted-F1':<10}")
    print("-" * 80)
    for code, res in ablation_results.items():
        print(f"{code:<8} | {res['name']:<30} | {res['accuracy']*100:>8.2f}% | {res['macro_f1']:>10.4f} | {res['weighted_f1']:>10.4f}")
    print("=" * 80)

    return final_payload


def main():
    parser = argparse.ArgumentParser(description="MindSense Phase 3 Multimodal Ablation Study Runner")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to best_model.pt checkpoint")
    parser.add_argument("--manifest", type=str, default=str(DATA_MANIFEST_PATH), help="Path to manifest JSON")
    parser.add_argument("--split", type=str, default="test", choices=["train", "val", "test"], help="Dataset split to evaluate")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    args = parser.parse_args()

    run_ablation_study(
        checkpoint_path=Path(args.checkpoint) if args.checkpoint else None,
        manifest_path=Path(args.manifest),
        split=args.split,
        batch_size=args.batch_size
    )


if __name__ == "__main__":
    main()
