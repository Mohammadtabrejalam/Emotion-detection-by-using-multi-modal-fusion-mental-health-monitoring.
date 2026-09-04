"""
Missing-Modality Robustness Evaluation — MindSense Phase 4

Evaluates the Phase 3 multimodal fusion model under controlled
random modality-missingness rates without retraining the model.
"""

import argparse
import json
import random
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import torch
from torch.utils.data import DataLoader

from ..baselines.common import filter_valid_multimodal_records
from ..baselines.metrics import compute_comprehensive_metrics
from ..data.dataset import MultimodalEmotionDataset, multimodal_collate_fn
from ..data.manifest import DatasetManifest
from ..data.preprocessing import DatasetPreprocessor
from .config import DATA_MANIFEST_PATH, NUM_CLASSES, get_device
from .model import MultimodalFusionTransformer


MODALITIES = ("text", "audio", "vision")
DEFAULT_MISSING_RATES = (0.10, 0.25, 0.50, 0.75)


def set_seed(seed: int) -> None:
    """Set deterministic random seeds for reproducible missingness masks."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def generate_missing_mask(
    batch_size: int,
    missing_rate: float,
    seed: int
) -> torch.Tensor:
    """
    Generate a reproducible modality-availability mask.

    Shape:
        (batch_size, 3)

    Order:
        [text, audio, vision]

    Value:
        1.0 = modality available
        0.0 = modality missing
    """
    if not 0.0 <= missing_rate <= 1.0:
        raise ValueError("missing_rate must be between 0.0 and 1.0")

    generator = torch.Generator()
    generator.manual_seed(seed)

    mask = torch.ones(
        (batch_size, len(MODALITIES)),
        dtype=torch.float32
    )

    if missing_rate == 0.0:
        return mask

    random_values = torch.rand(
        (batch_size, len(MODALITIES)),
        generator=generator
    )

    mask[random_values < missing_rate] = 0.0

    return mask


def apply_missing_mask(
    batch: Dict[str, torch.Tensor],
    modality_mask: torch.Tensor
) -> Dict[str, torch.Tensor]:
    """
    Zero-fill inputs corresponding to missing modalities.

    The model also receives modality_mask so it knows which
    modalities are unavailable.
    """
    text = batch["text"].clone()
    audio = batch["audio"].clone()
    vision = batch["vision"].clone()

    text[modality_mask[:, 0] == 0] = 0
    audio[modality_mask[:, 1] == 0] = 0
    vision[modality_mask[:, 2] == 0] = 0

    return {
        "text": text,
        "audio": audio,
        "vision": vision,
        "modality_mask": modality_mask
    }


def evaluate_missing_rate(
    model: torch.nn.Module,
    loader: DataLoader,
    device: torch.device,
    missing_rate: float,
    seed: int
) -> Dict[str, Any]:
    """Evaluate one controlled missing-modality rate."""
    predictions: List[int] = []
    targets: List[int] = []

    missing_counts = np.zeros(len(MODALITIES), dtype=np.int64)
    total_modality_slots = 0

    with torch.no_grad():
        for batch_index, batch in enumerate(loader):
            batch_size = batch["label"].shape[0]

            # Give each batch a deterministic but different seed.
            batch_seed = seed + batch_index
            modality_mask = generate_missing_mask(
                batch_size=batch_size,
                missing_rate=missing_rate,
                seed=batch_seed
            )

            prepared = apply_missing_mask(batch, modality_mask)

            text = prepared["text"].to(device)
            audio = prepared["audio"].to(device)
            vision = prepared["vision"].to(device)
            mask = prepared["modality_mask"].to(device)

            labels = batch["label"].to(device)

            outputs = model(
                text=text,
                audio=audio,
                vision=vision,
                modality_mask=mask
            )

            preds = torch.argmax(outputs["logits"], dim=1)

            predictions.extend(
                preds.cpu().numpy().tolist()
            )
            targets.extend(
                labels.cpu().numpy().tolist()
            )

            missing_counts += (
                modality_mask == 0
            ).sum(dim=0).numpy()

            total_modality_slots += batch_size

    metrics = compute_comprehensive_metrics(
        targets,
        predictions
    )

    return {
        "missing_rate": missing_rate,
        "accuracy": metrics["accuracy"],
        "macro_f1": metrics["macro_f1"],
        "weighted_f1": metrics["weighted_f1"],
        "macro_precision": metrics["macro_precision"],
        "macro_recall": metrics["macro_recall"],
        "total_samples": metrics["total_samples"],
        "missing_counts": {
            modality: int(missing_counts[index])
            for index, modality in enumerate(MODALITIES)
        },
        "actual_missing_percent": {
            modality: float(
                missing_counts[index]
                / total_modality_slots
                * 100.0
            )
            for index, modality in enumerate(MODALITIES)
        },
        "per_class": metrics["per_class"]
    }


def load_model(
    checkpoint_path: Path,
    device: torch.device
) -> MultimodalFusionTransformer:
    """Load the Phase 3 fusion checkpoint."""
    if not checkpoint_path.exists():
        raise FileNotFoundError(
            f"Fusion checkpoint not found: {checkpoint_path}"
        )

    checkpoint = torch.load(
        checkpoint_path,
        map_location=device,
        weights_only=True
    )

    config = checkpoint.get("config", {})

    model = MultimodalFusionTransformer(
        num_classes=config.get("num_classes", NUM_CLASSES),
        d_model=config.get("d_model", 64),
        nhead=config.get("nhead", 4)
    ).to(device)

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model.eval()

    return model


def run_missing_modality_evaluation(
    checkpoint_path: Path,
    manifest_path: Path = DATA_MANIFEST_PATH,
    split: str = "test",
    batch_size: int = 32,
    seed: int = 42,
    missing_rates: Optional[List[float]] = None,
    output_dir: Optional[Path] = None
) -> Dict[str, Any]:
    """
    Run Phase 4 missing-modality robustness evaluation.

    The model checkpoint is fixed. No training or parameter updates
    occur during this experiment.
    """
    if missing_rates is None:
        missing_rates = list(DEFAULT_MISSING_RATES)

    for rate in missing_rates:
        if not 0.0 <= rate <= 1.0:
            raise ValueError(
                f"Invalid missing rate: {rate}"
            )

    set_seed(seed)

    device = get_device()

    print("=" * 80)
    print("PHASE 4 — MISSING-MODALITY ROBUSTNESS")
    print("=" * 80)
    print(f"Checkpoint: {checkpoint_path}")
    print(f"Manifest:   {manifest_path}")
    print(f"Split:      {split}")
    print(f"Device:     {device}")
    print(f"Seed:       {seed}")
    print(
        "Missing rates:",
        ", ".join(f"{rate:.0%}" for rate in missing_rates)
    )

    model = load_model(
        checkpoint_path=checkpoint_path,
        device=device
    )

    manifest = DatasetManifest.load_json(
        manifest_path
    )

    raw_records = manifest.filter_by_split(split)

    records, excluded_count = filter_valid_multimodal_records(
        raw_records
    )

    print(
        f"Valid records: {len(records)} "
        f"(excluded: {excluded_count})"
    )

    preprocessor = DatasetPreprocessor(
        strict_paths=True
    )

    dataset = MultimodalEmotionDataset(
        records,
        preprocessor=preprocessor
    )

    loader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=False,
        collate_fn=multimodal_collate_fn
    )

    results: Dict[str, Any] = {}

    # Complete-modality baseline.
    baseline = evaluate_missing_rate(
        model=model,
        loader=loader,
        device=device,
        missing_rate=0.0,
        seed=seed
    )

    results["0.00"] = baseline

    print(
        f"\nBaseline 0% missing | "
        f"Accuracy={baseline['accuracy']:.4f} | "
        f"Macro-F1={baseline['macro_f1']:.4f} | "
        f"Weighted-F1={baseline['weighted_f1']:.4f}"
    )

    for rate in missing_rates:
        key = f"{rate:.2f}"

        result = evaluate_missing_rate(
            model=model,
            loader=loader,
            device=device,
            missing_rate=rate,
            seed=seed
        )

        results[key] = result

        print(
            f"{rate:.0%} missing       | "
            f"Accuracy={result['accuracy']:.4f} | "
            f"Macro-F1={result['macro_f1']:.4f} | "
            f"Weighted-F1={result['weighted_f1']:.4f}"
        )


        # ------------------------------------------------------------------
    # Modality-specific missingness
    # ------------------------------------------------------------------
    # Each experiment removes exactly one modality from every sample.
    # This measures the individual contribution of Text, Audio, and Vision.
    modality_specific_results = {}

    modality_masks = {
        "text_missing": [0.0, 1.0, 1.0],
        "audio_missing": [1.0, 0.0, 1.0],
        "vision_missing": [1.0, 1.0, 0.0],
    }

    for condition_name, mask_values in modality_masks.items():
        predictions: List[int] = []
        targets: List[int] = []

        fixed_mask = torch.tensor(
            mask_values,
            dtype=torch.float32
        )

        with torch.no_grad():
            for batch in loader:
                batch_size = batch["label"].shape[0]

                modality_mask = fixed_mask.unsqueeze(0).repeat(
                    batch_size, 1
                )

                prepared = apply_missing_mask(
                    batch,
                    modality_mask
                )

                text = prepared["text"].to(device)
                audio = prepared["audio"].to(device)
                vision = prepared["vision"].to(device)
                mask = prepared["modality_mask"].to(device)
                labels = batch["label"].to(device)

                outputs = model(
                    text=text,
                    audio=audio,
                    vision=vision,
                    modality_mask=mask
                )

                preds = torch.argmax(
                    outputs["logits"],
                    dim=1
                )

                predictions.extend(
                    preds.cpu().numpy().tolist()
                )

                targets.extend(
                    labels.cpu().numpy().tolist()
                )

        metrics = compute_comprehensive_metrics(
            targets,
            predictions
        )

        modality_specific_results[condition_name] = {
            "missing_modality": condition_name.replace(
                "_missing",
                ""
            ),
            "accuracy": metrics["accuracy"],
            "macro_f1": metrics["macro_f1"],
            "weighted_f1": metrics["weighted_f1"],
            "macro_precision": metrics["macro_precision"],
            "macro_recall": metrics["macro_recall"],
            "total_samples": metrics["total_samples"],
            "per_class": metrics["per_class"]
        }

        print(
            f"{condition_name:<18} | "
            f"Accuracy={metrics['accuracy']:.4f} | "
            f"Macro-F1={metrics['macro_f1']:.4f} | "
            f"Weighted-F1={metrics['weighted_f1']:.4f}"
        )

    # ------------------------------------------------------------------
    # Single-modality conditions
    # ------------------------------------------------------------------
    # Only one modality remains available in each experiment.
    single_modality_results = {}

    single_modality_masks = {
        "text_only": [1.0, 0.0, 0.0],
        "audio_only": [0.0, 1.0, 0.0],
        "vision_only": [0.0, 0.0, 1.0],
    }

    for condition_name, mask_values in single_modality_masks.items():
        predictions: List[int] = []
        targets: List[int] = []

        fixed_mask = torch.tensor(
            mask_values,
            dtype=torch.float32
        )

        with torch.no_grad():
            for batch in loader:
                batch_size = batch["label"].shape[0]

                modality_mask = fixed_mask.unsqueeze(0).repeat(
                    batch_size, 1
                )

                prepared = apply_missing_mask(
                    batch,
                    modality_mask
                )

                text = prepared["text"].to(device)
                audio = prepared["audio"].to(device)
                vision = prepared["vision"].to(device)
                mask = prepared["modality_mask"].to(device)
                labels = batch["label"].to(device)

                outputs = model(
                    text=text,
                    audio=audio,
                    vision=vision,
                    modality_mask=mask
                )

                preds = torch.argmax(
                    outputs["logits"],
                    dim=1
                )

                predictions.extend(
                    preds.cpu().numpy().tolist()
                )

                targets.extend(
                    labels.cpu().numpy().tolist()
                )

        metrics = compute_comprehensive_metrics(
            targets,
            predictions
        )

        single_modality_results[condition_name] = {
            "active_modality": condition_name.replace(
                "_only",
                ""
            ),
            "accuracy": metrics["accuracy"],
            "macro_f1": metrics["macro_f1"],
            "weighted_f1": metrics["weighted_f1"],
            "macro_precision": metrics["macro_precision"],
            "macro_recall": metrics["macro_recall"],
            "total_samples": metrics["total_samples"],
            "per_class": metrics["per_class"]
        }

        print(
            f"{condition_name:<18} | "
            f"Accuracy={metrics['accuracy']:.4f} | "
            f"Macro-F1={metrics['macro_f1']:.4f} | "
            f"Weighted-F1={metrics['weighted_f1']:.4f}"
        )

    if output_dir is None:
        output_dir = Path("artifacts") / "missing_modality"

    output_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    payload = {
        "experiment": "Phase 4 Missing-Modality Robustness",
        "checkpoint": str(checkpoint_path),
        "manifest": str(manifest_path),
        "split": split,
        "seed": seed,
        "batch_size": batch_size,
        "device": str(device),
        "excluded_records": excluded_count,
        "missing_rates": [0.0] + missing_rates,
        "modalities": list(MODALITIES),
        "modality_specific_results": modality_specific_results,
        "single_modality_results": single_modality_results,
        "results": results
    }

    output_path = (
        output_dir / "missing_modality_results.json"
    )

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            payload,
            file,
            indent=2
        )

    print("\nResults saved to:")
    print(output_path)

    return payload


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "MindSense Phase 4 missing-modality "
            "robustness evaluation"
        )
    )

    parser.add_argument(
        "--checkpoint",
        type=str,
        required=True,
        help="Path to the Phase 3 fusion checkpoint"
    )

    parser.add_argument(
        "--manifest",
        type=str,
        default=str(DATA_MANIFEST_PATH),
        help="Path to MELD manifest"
    )

    parser.add_argument(
        "--split",
        type=str,
        default="test",
        choices=["train", "val", "test"]
    )

    parser.add_argument(
        "--batch-size",
        type=int,
        default=32
    )

    parser.add_argument(
        "--seed",
        type=int,
        default=42
    )

    parser.add_argument(
        "--missing-rates",
        type=float,
        nargs="+",
        default=list(DEFAULT_MISSING_RATES),
        help="Missing modality rates as decimals"
    )

    parser.add_argument(
        "--output-dir",
        type=str,
        default=None
    )

    args = parser.parse_args()

    run_missing_modality_evaluation(
        checkpoint_path=Path(args.checkpoint),
        manifest_path=Path(args.manifest),
        split=args.split,
        batch_size=args.batch_size,
        seed=args.seed,
        missing_rates=args.missing_rates,
        output_dir=(
            Path(args.output_dir)
            if args.output_dir
            else None
        )
    )


if __name__ == "__main__":
    main()