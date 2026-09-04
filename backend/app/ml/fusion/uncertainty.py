"""
Phase 5: Uncertainty & Confidence Evaluation

MindSense multimodal fusion model.

This module evaluates:
- Predictive confidence
- Predictive entropy
- Negative Log-Likelihood (NLL)
- Brier score
- Expected Calibration Error (ECE)
- Temperature scaling
- Risk-coverage analysis

Methodological rule:
Temperature is fitted ONLY on the validation split.
The test split is used only for final evaluation.
"""

import argparse
import json
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

import numpy as np
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader

from ..data.manifest import DatasetManifest
from ..data.dataset import MultimodalEmotionDataset, multimodal_collate_fn
from ..data.preprocessing import DatasetPreprocessor
from ..baselines.common import filter_valid_multimodal_records
from ..baselines.metrics import compute_comprehensive_metrics
from .config import (
    DATA_MANIFEST_PATH,
    NUM_CLASSES,
    EMOTION_CLASSES,
    get_device,
)
from .model import MultimodalFusionTransformer


def compute_entropy(probabilities: np.ndarray) -> np.ndarray:
    """Compute normalized predictive entropy."""
    probabilities = np.clip(
        probabilities,
        1e-12,
        1.0,
    )

    entropy = -np.sum(
        probabilities * np.log(probabilities),
        axis=1,
    )

    normalization = np.log(probabilities.shape[1])

    if normalization > 0:
        entropy = entropy / normalization

    return entropy


def compute_nll(
    probabilities: np.ndarray,
    targets: np.ndarray,
) -> float:
    """Compute multiclass Negative Log-Likelihood."""
    probabilities = np.clip(
        probabilities,
        1e-12,
        1.0,
    )

    sample_indices = np.arange(len(targets))

    nll = -np.mean(
        np.log(
            probabilities[
                sample_indices,
                targets,
            ]
        )
    )

    return float(nll)


def compute_brier_score(
    probabilities: np.ndarray,
    targets: np.ndarray,
    num_classes: int,
) -> float:
    """Compute multiclass Brier score."""
    one_hot = np.zeros(
        (len(targets), num_classes),
        dtype=np.float64,
    )

    one_hot[
        np.arange(len(targets)),
        targets,
    ] = 1.0

    brier = np.mean(
        np.sum(
            (probabilities - one_hot) ** 2,
            axis=1,
        )
    )

    return float(brier)


def compute_ece(
    probabilities: np.ndarray,
    targets: np.ndarray,
    num_bins: int = 10,
) -> Tuple[float, list]:
    """Compute Expected Calibration Error."""
    predictions = np.argmax(
        probabilities,
        axis=1,
    )

    confidences = np.max(
        probabilities,
        axis=1,
    )

    correct = (
        predictions == targets
    ).astype(np.float64)

    bin_edges = np.linspace(
        0.0,
        1.0,
        num_bins + 1,
    )

    ece = 0.0
    bin_results = []

    total = len(targets)

    for bin_index in range(num_bins):
        lower = bin_edges[bin_index]
        upper = bin_edges[bin_index + 1]

        if bin_index == num_bins - 1:
            mask = (
                (confidences >= lower)
                & (confidences <= upper)
            )
        else:
            mask = (
                (confidences >= lower)
                & (confidences < upper)
            )

        count = int(np.sum(mask))

        if count == 0:
            bin_results.append(
                {
                    "bin": bin_index,
                    "lower": float(lower),
                    "upper": float(upper),
                    "count": 0,
                    "accuracy": None,
                    "confidence": None,
                    "gap": None,
                }
            )
            continue

        bin_accuracy = float(
            np.mean(correct[mask])
        )

        bin_confidence = float(
            np.mean(confidences[mask])
        )

        gap = abs(
            bin_accuracy - bin_confidence
        )

        ece += (
            count / total
        ) * gap

        bin_results.append(
            {
                "bin": bin_index,
                "lower": float(lower),
                "upper": float(upper),
                "count": count,
                "accuracy": bin_accuracy,
                "confidence": bin_confidence,
                "gap": float(gap),
            }
        )

    return float(ece), bin_results


def collect_predictions(
    model: torch.nn.Module,
    loader: DataLoader,
    device: torch.device,
) -> Tuple[np.ndarray, np.ndarray]:
    """Collect logits and labels without changing model parameters."""
    model.eval()

    all_logits = []
    all_targets = []

    with torch.no_grad():
        for batch in loader:
            text = batch["text"].to(device)
            audio = batch["audio"].to(device)
            vision = batch["vision"].to(device)
            modality_mask = batch["modality_mask"].to(device)
            targets = batch["label"].to(device)

            outputs = model(
                text=text,
                audio=audio,
                vision=vision,
                modality_mask=modality_mask,
            )

            all_logits.append(
                outputs["logits"].detach().cpu()
            )

            all_targets.append(
                targets.detach().cpu()
            )

    logits = torch.cat(
        all_logits,
        dim=0,
    ).numpy()

    targets = torch.cat(
        all_targets,
        dim=0,
    ).numpy()

    return logits, targets


def load_fusion_model(
    checkpoint_path: Path,
    device: torch.device,
) -> torch.nn.Module:
    """Load the Phase 3 fusion checkpoint."""
    checkpoint = torch.load(
        checkpoint_path,
        map_location=device,
        weights_only=False,
    )

    config = checkpoint.get(
        "config",
        {},
    )

    model = MultimodalFusionTransformer(
        num_classes=config.get(
            "num_classes",
            NUM_CLASSES,
        ),
        d_model=config.get(
            "d_model",
            64,
        ),
        nhead=config.get(
            "nhead",
            4,
        ),
    ).to(device)

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model.eval()

    return model


def fit_temperature(
    logits: np.ndarray,
    targets: np.ndarray,
    device: torch.device,
    max_iter: int = 100,
) -> float:
    """
    Fit a single scalar temperature using validation data ONLY.

    The optimization minimizes unweighted cross-entropy / NLL.

    T > 1 generally softens probabilities.
    T < 1 generally sharpens probabilities.
    """
    logits_tensor = torch.tensor(
        logits,
        dtype=torch.float32,
        device=device,
    )

    targets_tensor = torch.tensor(
        targets,
        dtype=torch.long,
        device=device,
    )

    temperature = torch.nn.Parameter(
        torch.ones(
            1,
            dtype=torch.float32,
            device=device,
        )
    )

    criterion = torch.nn.CrossEntropyLoss()

    optimizer = torch.optim.LBFGS(
        [temperature],
        lr=0.01,
        max_iter=max_iter,
        line_search_fn="strong_wolfe",
    )

    def closure():
        optimizer.zero_grad()

        safe_temperature = temperature.clamp(
            min=0.05,
            max=10.0,
        )

        loss = criterion(
            logits_tensor / safe_temperature,
            targets_tensor,
        )

        loss.backward()

        return loss

    optimizer.step(closure)

    fitted_temperature = float(
        temperature.detach()
        .clamp(
            min=0.05,
            max=10.0,
        )
        .cpu()
        .item()
    )

    return fitted_temperature


def apply_temperature(
    logits: np.ndarray,
    temperature: float,
) -> np.ndarray:
    """Convert logits to probabilities using fitted temperature."""
    logits_tensor = torch.tensor(
        logits,
        dtype=torch.float32,
    )

    probabilities = F.softmax(
        logits_tensor / temperature,
        dim=1,
    ).numpy()

    return probabilities


def summarize_predictions(
    logits: np.ndarray,
    targets: np.ndarray,
    probabilities: np.ndarray,
) -> Dict[str, Any]:
    """Calculate classification and uncertainty metrics."""
    predictions = np.argmax(
        probabilities,
        axis=1,
    )

    confidence = np.max(
        probabilities,
        axis=1,
    )

    entropy = compute_entropy(
        probabilities
    )

    nll = compute_nll(
        probabilities,
        targets,
    )

    brier = compute_brier_score(
        probabilities,
        targets,
        NUM_CLASSES,
    )

    ece, calibration_bins = compute_ece(
        probabilities,
        targets,
        num_bins=10,
    )

    classification_metrics = (
        compute_comprehensive_metrics(
            targets.tolist(),
            predictions.tolist(),
        )
    )

    return {
        "classification": {
            "accuracy": classification_metrics[
                "accuracy"
            ],
            "macro_f1": classification_metrics[
                "macro_f1"
            ],
            "weighted_f1": classification_metrics[
                "weighted_f1"
            ],
        },
        "uncertainty": {
            "mean_confidence": float(
                np.mean(confidence)
            ),
            "median_confidence": float(
                np.median(confidence)
            ),
            "mean_entropy": float(
                np.mean(entropy)
            ),
            "median_entropy": float(
                np.median(entropy)
            ),
        },
        "calibration": {
            "nll": nll,
            "brier_score": brier,
            "ece": ece,
            "num_bins": 10,
            "bins": calibration_bins,
        },
        "prediction_distribution": {
            str(class_name): int(
                np.sum(
                    predictions == class_index
                )
            )
            for class_index, class_name
            in enumerate(EMOTION_CLASSES)
        },
    }


def build_loader(
    manifest_path: Path,
    split: str,
    batch_size: int,
) -> Tuple[DataLoader, int]:
    """Build the established MindSense dataset loader."""
    manifest = DatasetManifest.load_json(
        manifest_path
    )

    raw_records = manifest.filter_by_split(
        split
    )

    records, excluded = (
        filter_valid_multimodal_records(
            raw_records
        )
    )

    preprocessor = DatasetPreprocessor(
        strict_paths=True
    )

    dataset = MultimodalEmotionDataset(
        records,
        preprocessor=preprocessor,
    )

    loader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=False,
        collate_fn=multimodal_collate_fn,
    )

    return loader, excluded


def compute_risk_coverage(
    probabilities,
    targets,
    coverage_points=None,
):
    """Compute selective prediction risk from 0% to 100% coverage."""
    probabilities = np.asarray(
        probabilities,
        dtype=np.float64,
    )

    targets = np.asarray(
        targets,
        dtype=np.int64,
    )

    if coverage_points is None:
        coverage_points = np.linspace(
            0.0,
            1.0,
            11,
        )

    predictions = np.argmax(
        probabilities,
        axis=1,
    )

    confidence = np.max(
        probabilities,
        axis=1,
    )

    correct = predictions == targets

    order = np.argsort(
        -confidence,
        kind="stable",
    )

    sorted_correct = correct[order]
    sorted_confidence = confidence[order]

    total = len(targets)

    if total == 0:
        return []

    results = []

    for requested_coverage in coverage_points:
        requested_coverage = float(
            np.clip(
                requested_coverage,
                0.0,
                1.0,
            )
        )

        if requested_coverage == 0.0:
            results.append(
                {
                    "requested_coverage": 0.0,
                    "actual_coverage": 0.0,
                    "accepted_samples": 0,
                    "accuracy": 1.0,
                    "risk": 0.0,
                    "confidence_threshold": None,
                }
            )
            continue

        accepted_count = int(
            np.ceil(
                requested_coverage * total
            )
        )

        accepted_count = max(
            1,
            accepted_count,
        )

        accepted_count = min(
            accepted_count,
            total,
        )

        accepted_correct = (
            sorted_correct[:accepted_count]
        )

        accuracy = float(
            np.mean(accepted_correct)
        )

        risk = 1.0 - accuracy

        actual_coverage = (
            accepted_count / total
        )

        threshold = float(
            sorted_confidence[
                accepted_count - 1
            ]
        )

        results.append(
            {
                "requested_coverage": requested_coverage,
                "actual_coverage": float(
                    actual_coverage
                ),
                "accepted_samples": int(
                    accepted_count
                ),
                "accuracy": accuracy,
                "risk": risk,
                "confidence_threshold": threshold,
            }
        )

    return results


def compute_area_under_risk_coverage(
    risk_coverage,
):
    """Compute conventional area under the risk-coverage curve."""
    if not risk_coverage:
        return 0.0

    coverage = np.array(
        [
            item["actual_coverage"]
            for item in risk_coverage
        ],
        dtype=np.float64,
    )

    risk = np.array(
        [
            item["risk"]
            for item in risk_coverage
        ],
        dtype=np.float64,
    )

    order = np.argsort(coverage)

    coverage = coverage[order]
    risk = risk[order]

    return float(
        np.trapezoid(
            risk,
            coverage,
        )
    )

def run_temperature_scaling(
    checkpoint_path: Path,
    manifest_path: Path = DATA_MANIFEST_PATH,
    batch_size: int = 32,
    output_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Fit temperature on validation data and evaluate calibrated
    probabilities on the untouched test set.
    """
    device = get_device()

    print("=" * 75)
    print("PHASE 5 — TEMPERATURE SCALING")
    print("=" * 75)

    print(
        f"Checkpoint: {checkpoint_path}"
    )

    print(
        f"Manifest:   {manifest_path}"
    )

    print(
        f"Batch size: {batch_size}"
    )

    print(
        f"Device:     {device}"
    )

    print("=" * 75)

    model = load_fusion_model(
        checkpoint_path,
        device,
    )

    print(
        "\nCollecting validation predictions..."
    )

    val_loader, val_excluded = build_loader(
        manifest_path,
        "val",
        batch_size,
    )

    val_logits, val_targets = (
        collect_predictions(
            model,
            val_loader,
            device,
        )
    )

    print(
        f"Validation samples: "
        f"{len(val_targets)} "
        f"(excluded: {val_excluded})"
    )

    print(
        "\nFitting temperature on validation set..."
    )

    temperature = fit_temperature(
        val_logits,
        val_targets,
        device,
    )

    print(
        f"Fitted temperature: "
        f"{temperature:.6f}"
    )

    val_before_probs = F.softmax(
        torch.from_numpy(val_logits),
        dim=1,
    ).numpy()

    val_after_probs = apply_temperature(
        val_logits,
        temperature,
    )

    val_before = summarize_predictions(
        val_logits,
        val_targets,
        val_before_probs,
    )

    val_after = summarize_predictions(
        val_logits,
        val_targets,
        val_after_probs,
    )

    print(
        "\nValidation calibration:"
    )

    print(
        f"  Before NLL: "
        f"{val_before['calibration']['nll']:.4f}"
    )

    print(
        f"  After NLL:  "
        f"{val_after['calibration']['nll']:.4f}"
    )

    print(
        f"  Before ECE: "
        f"{val_before['calibration']['ece']:.4f}"
    )

    print(
        f"  After ECE:  "
        f"{val_after['calibration']['ece']:.4f}"
    )

    print(
        "\nCollecting untouched test predictions..."
    )

    test_loader, test_excluded = build_loader(
        manifest_path,
        "test",
        batch_size,
    )

    test_logits, test_targets = (
        collect_predictions(
            model,
            test_loader,
            device,
        )
    )

    print(
        f"Test samples: "
        f"{len(test_targets)} "
        f"(excluded: {test_excluded})"
    )

    test_before_probs = F.softmax(
        torch.from_numpy(test_logits),
        dim=1,
    ).numpy()

    test_after_probs = apply_temperature(
        test_logits,
        temperature,
    )

    test_before = summarize_predictions(
        test_logits,
        test_targets,
        test_before_probs,
    )

    test_after = summarize_predictions(
        test_logits,
        test_targets,
        test_after_probs,
    )

    test_risk_coverage = compute_risk_coverage(
        test_after_probs,
        test_targets,
    )

    test_risk_coverage_auc = (
        compute_area_under_risk_coverage(
            test_risk_coverage
        )
    )

    print(
        "\nRisk-Coverage Analysis:"
    )

    for item in test_risk_coverage:
        print(
            f"  Coverage="
            f"{item['actual_coverage']:.4f} | "
            f"Accuracy="
            f"{item['accuracy']:.4f} | "
            f"Risk="
            f"{item['risk']:.4f} | "
            f"Threshold="
            f"{item['confidence_threshold']:.4f}"
        )

    print(
        f"Risk-Coverage AUC: "
        f"{test_risk_coverage_auc:.4f}"
    )

    results = {
        "phase": 5,
        "experiment": "E07_Temperature_Scaling",
        "checkpoint": str(
            checkpoint_path
        ),
        "manifest": str(
            manifest_path
        ),
        "device": str(device),
        "batch_size": batch_size,
        "temperature": temperature,

        "methodology": {
            "temperature_fit_split": "val",
            "final_evaluation_split": "test",
            "test_used_for_temperature_fitting": False,
            "num_temperature_parameters": 1,
        },

        "validation": {
            "samples": int(
                len(val_targets)
            ),
            "excluded": int(
                val_excluded
            ),
            "before": val_before,
            "after": val_after,
        },

        "test": {
            "samples": int(
                len(test_targets)
            ),
            "excluded": int(
                test_excluded
            ),
            "before": test_before,
            "after": test_after,
            "risk_coverage": test_risk_coverage,
            "risk_coverage_auc": (
                test_risk_coverage_auc
            ),
        },
    }

    if output_dir is None:
        output_dir = (
            Path("artifacts")
            / "uncertainty"
        )

    output_dir = Path(
        output_dir
    )

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = (
        output_dir
        / "temperature_scaling_results.json"
    )

    with open(
        output_path,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            results,
            file,
            indent=2,
        )

    print(
        "\n" + "=" * 75
    )

    print(
        "FINAL TEST RESULTS — "
        "TEMPERATURE SCALING"
    )

    print(
        "=" * 75
    )

    print(
        "\nBefore calibration:"
    )

    print(
        f"  Accuracy:    "
        f"{test_before['classification']['accuracy']:.4f}"
    )

    print(
        f"  Macro-F1:    "
        f"{test_before['classification']['macro_f1']:.4f}"
    )

    print(
        f"  NLL:         "
        f"{test_before['calibration']['nll']:.4f}"
    )

    print(
        f"  Brier:       "
        f"{test_before['calibration']['brier_score']:.4f}"
    )

    print(
        f"  ECE:         "
        f"{test_before['calibration']['ece']:.4f}"
    )

    print(
        "\nAfter calibration:"
    )

    print(
        f"  Accuracy:    "
        f"{test_after['classification']['accuracy']:.4f}"
    )

    print(
        f"  Macro-F1:    "
        f"{test_after['classification']['macro_f1']:.4f}"
    )

    print(
        f"  NLL:         "
        f"{test_after['calibration']['nll']:.4f}"
    )

    print(
        f"  Brier:       "
        f"{test_after['calibration']['brier_score']:.4f}"
    )

    print(
        f"  ECE:         "
        f"{test_after['calibration']['ece']:.4f}"
    )

    print(
        f"\nRisk-Coverage AUC: "
        f"{test_risk_coverage_auc:.4f}"
    )

    print(
        f"\nSaved: {output_path}"
    )

    print(
        "=" * 75
    )

    return results


def main():
    parser = argparse.ArgumentParser(
        description=(
            "MindSense Phase 5 "
            "Temperature Scaling"
        )
    )

    parser.add_argument(
        "--checkpoint",
        type=str,
        required=True,
    )

    parser.add_argument(
        "--manifest",
        type=str,
        default=str(
            DATA_MANIFEST_PATH
        ),
    )

    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
    )

    parser.add_argument(
        "--output-dir",
        type=str,
        default="artifacts/uncertainty",
    )

    args = parser.parse_args()

    run_temperature_scaling(
        checkpoint_path=Path(
            args.checkpoint
        ),
        manifest_path=Path(
            args.manifest
        ),
        batch_size=args.batch_size,
        output_dir=Path(
            args.output_dir
        ),
    )


if __name__ == "__main__":
    main()