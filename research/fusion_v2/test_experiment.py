"""Mathematical regression checks; fixtures are not evaluation samples."""

import json
import numpy as np
from backend.app.inference.service import fuse
from research.fusion_v2.experiment import (
    LABELS,
    P,
    S,
    O,
    hierarchical,
    temperature,
    reliability,
    metrics,
    norm,
)


def test_mass_preservation_and_endpoints():
    a = np.array([[0.1, 0.2, 0.3, 0.4]])
    v = norm(np.array([[1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]]))
    for w in [0, 0.25, 0.5, 1]:
        q = hierarchical(a, v, w)
        np.testing.assert_allclose(q[:, O], v[:, O])
        np.testing.assert_allclose(q[:, S].sum(1), v[:, S].sum(1))
        np.testing.assert_allclose(q.sum(1), 1)
    np.testing.assert_allclose(hierarchical(a, v, 0), v)
    np.testing.assert_allclose(
        hierarchical(a, v, 1)[:, S], a * v[:, S].sum(1, keepdims=True)
    )


def test_temperature_preserves_order_and_normalization():
    p = np.array([[0.1, 0.2, 0.7]])
    for t in [0.5, 1, 2, 4]:
        q = temperature(p, t)
        assert q.argmax() == p.argmax()
        np.testing.assert_allclose(q.sum(), 1)
    np.testing.assert_allclose(temperature(p, 1), p)


def test_reliability_smoothing_has_no_unseen_class_certainty():
    r = reliability(np.array([[0.8, 0.2], [0.7, 0.3]]), np.array([0, 1]), 2)
    np.testing.assert_allclose(r, [0.5, 0.5])


def test_legacy_vectorization_matches_serving_implementation():
    a = np.array([[0.1, 0.2, 0.3, 0.4]])
    v = norm(np.array([[1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]]))
    q = v.copy()
    q[:, S] = (v[:, S] + a) / 2
    expected = fuse(
        {
            "audio": {"probabilities": dict(zip([LABELS[i] for i in S], a[0]))},
            "image": {"probabilities": dict(zip(LABELS, v[0]))},
        }
    )
    np.testing.assert_allclose(norm(q)[0], [expected[c] for c in LABELS])


def test_metrics_include_absent_classes_and_perfect_calibration():
    result = metrics(np.arange(7), np.eye(7))
    assert result["accuracy"] == result["macro_f1"] == 1
    assert result["nll"] == result["brier"] == result["ece_10"] == 0
    assert len(result["confusion_matrix"]) == 7


def test_protocol_separates_actors_and_exploratory_data():
    p = json.loads((P / "protocol.json").read_text())
    groups = [
        set(p[k])
        for k in [
            "train_actors",
            "validation_actors",
            "test_actors",
            "excluded_exploratory_actors",
        ]
    ]
    for i, g in enumerate(groups):
        for other in groups[i + 1 :]:
            assert not g.intersection(other)
