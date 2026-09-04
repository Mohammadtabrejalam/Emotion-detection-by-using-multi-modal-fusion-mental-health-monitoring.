import numpy as np

from backend.app.ml.fusion.uncertainty import (
    compute_entropy,
    compute_nll,
    compute_brier_score,
    compute_ece,
    compute_risk_coverage,
    compute_area_under_risk_coverage,
)


def test_entropy_uniform_is_one():
    probabilities = np.array(
        [
            [1 / 3, 1 / 3, 1 / 3],
            [1 / 3, 1 / 3, 1 / 3],
        ],
        dtype=float,
    )

    entropy = compute_entropy(probabilities)

    assert np.allclose(entropy, 1.0)


def test_entropy_confident_prediction_is_lower():
    probabilities = np.array(
        [
            [0.99, 0.005, 0.005],
        ],
        dtype=float,
    )

    entropy = compute_entropy(probabilities)

    assert entropy[0] < 0.1


def test_entropy_values_are_bounded():
    probabilities = np.array(
        [
            [0.9, 0.05, 0.05],
            [0.5, 0.3, 0.2],
            [1 / 3, 1 / 3, 1 / 3],
        ],
        dtype=float,
    )

    entropy = compute_entropy(probabilities)

    assert np.all(entropy >= 0.0)
    assert np.all(entropy <= 1.0)


def test_nll_uses_target_probability():
    probabilities = np.array(
        [
            [0.8, 0.2],
            [0.25, 0.75],
        ],
        dtype=float,
    )

    targets = np.array([0, 1])

    nll = compute_nll(probabilities, targets)

    expected = -(np.log(0.8) + np.log(0.75)) / 2

    assert np.isclose(nll, expected)


def test_brier_score_perfect_predictions():
    probabilities = np.array(
        [
            [1.0, 0.0],
            [0.0, 1.0],
        ],
        dtype=float,
    )

    targets = np.array([0, 1])

    brier = compute_brier_score(
        probabilities,
        targets,
        num_classes=2,
    )

    assert np.isclose(brier, 0.0)


def test_brier_score_is_non_negative():
    probabilities = np.array(
        [
            [0.8, 0.2],
            [0.4, 0.6],
        ],
        dtype=float,
    )

    targets = np.array([0, 1])

    brier = compute_brier_score(
        probabilities,
        targets,
        num_classes=2,
    )

    assert brier >= 0.0


def test_risk_coverage_returns_requested_points():
    probabilities = np.array(
        [
            [0.9, 0.1],
            [0.8, 0.2],
            [0.6, 0.4],
            [0.3, 0.7],
        ]
    )

    targets = np.array([0, 0, 1, 1])

    result = compute_risk_coverage(
        probabilities,
        targets,
        coverage_points=[0.25, 0.5, 1.0],
    )

    assert len(result) == 3
    assert result[0]["requested_coverage"] == 0.25
    assert result[-1]["actual_coverage"] == 1.0


def test_risk_coverage_accepts_highest_confidence_first():
    probabilities = np.array(
        [
            [0.51, 0.49],
            [0.99, 0.01],
            [0.60, 0.40],
        ]
    )

    # Corrected:
    # The highest-confidence prediction [0.99, 0.01]
    # predicts class 0, so its target must also be 0.
    targets = np.array([1, 0, 0])

    result = compute_risk_coverage(
        probabilities,
        targets,
        coverage_points=[1 / 3],
    )

    # Highest-confidence sample is the correctly
    # classified second sample.
    assert result[0]["accepted_samples"] == 1
    assert result[0]["accuracy"] == 1.0
    assert result[0]["risk"] == 0.0


def test_risk_coverage_accuracy_and_risk():
    probabilities = np.array(
        [
            [0.95, 0.05],
            [0.90, 0.10],
            [0.80, 0.20],
            [0.70, 0.30],
        ]
    )

    targets = np.array([0, 1, 1, 0])

    result = compute_risk_coverage(
        probabilities,
        targets,
        coverage_points=[0.5, 1.0],
    )

    assert result[0]["accuracy"] == 0.5
    assert result[0]["risk"] == 0.5

    assert result[1]["accuracy"] == 0.5
    assert result[1]["risk"] == 0.5


def test_area_under_risk_coverage_is_non_negative():
    risk_coverage = [
        {
            "actual_coverage": 0.25,
            "risk": 0.1,
        },
        {
            "actual_coverage": 0.50,
            "risk": 0.2,
        },
        {
            "actual_coverage": 0.75,
            "risk": 0.3,
        },
        {
            "actual_coverage": 1.00,
            "risk": 0.4,
        },
    ]

    aurc = compute_area_under_risk_coverage(risk_coverage)

    assert aurc >= 0.0


def test_ece_perfectly_calibrated_predictions():
    probabilities = np.array(
        [
            [1.0, 0.0],
            [1.0, 0.0],
            [0.0, 1.0],
            [0.0, 1.0],
        ],
        dtype=float,
    )

    targets = np.array([0, 0, 1, 1])

    ece, bins = compute_ece(
        probabilities,
        targets,
        num_bins=10,
    )

    assert np.isclose(ece, 0.0)
    assert len(bins) == 10


def test_ece_is_non_negative():
    probabilities = np.array(
        [
            [0.9, 0.1],
            [0.8, 0.2],
            [0.6, 0.4],
            [0.55, 0.45],
        ],
        dtype=float,
    )

    targets = np.array([1, 1, 0, 1])

    ece, _ = compute_ece(
        probabilities,
        targets,
        num_bins=10,
    )

    assert ece >= 0.0


def test_ece_bins_cover_all_samples():
    probabilities = np.array(
        [
            [0.9, 0.1],
            [0.8, 0.2],
            [0.6, 0.4],
            [0.5, 0.5],
        ],
        dtype=float,
    )

    targets = np.array([0, 0, 1, 1])

    _, bins = compute_ece(
        probabilities,
        targets,
        num_bins=10,
    )

    total_bin_samples = sum(
        item["count"] for item in bins
    )

    assert total_bin_samples == len(targets)