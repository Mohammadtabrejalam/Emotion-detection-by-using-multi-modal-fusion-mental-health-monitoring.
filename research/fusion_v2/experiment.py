"""Original actor-disjoint frozen-expert comparison, recovered from execution transcript.

The computational procedure and fixed grid are unchanged. Test labels are used
only to evaluate; they never select temperatures, reliability or fusion weights.
"""

import json, hashlib, itertools
from pathlib import Path
import numpy as np
from sklearn.metrics import f1_score, confusion_matrix
from backend.app.inference.registry import LABELS

P = Path(__file__).parent
S = np.array([LABELS.index(x) for x in ["happy", "sad", "angry", "neutral"]])
O = np.array([i for i in range(7) if i not in S])


def norm(p):
    return p / p.sum(axis=-1, keepdims=True)


def temperature(p, t):
    return norm(np.maximum(p, 1e-12) ** (1 / t))


def entropy(p):
    return -(p * np.log(np.maximum(p, 1e-12))).sum(axis=-1)


def metrics(y, p):
    pred = p.argmax(1)
    conf = p.max(1)
    correct = pred == y
    ece = 0.0
    for lo in np.arange(0, 1, 0.1):
        take = (conf >= lo) & (conf < lo + 0.1 if lo < 0.9 else conf <= 1)
        if take.any():
            ece += take.mean() * abs(correct[take].mean() - conf[take].mean())
    return {
        "n": len(y),
        "accuracy": float(correct.mean()),
        "macro_f1": float(
            f1_score(y, pred, labels=range(7), average="macro", zero_division=0)
        ),
        "confusion_matrix": confusion_matrix(y, pred, labels=range(7)).tolist(),
        "nll": float(-np.log(np.maximum(p[np.arange(len(y)), y], 1e-12)).mean()),
        "brier": float(((p - np.eye(7)[y]) ** 2).sum(1).mean()),
        "ece_10": float(ece),
        "mean_entropy": float(entropy(p).mean()),
        "selective_accuracy": {
            str(c): float(correct[np.argsort(-conf)[: max(1, int(c * len(y)))]].mean())
            for c in [0.5, 0.8, 1.0]
        },
    }


def hierarchical(a, v, w):
    q = v.copy()
    mass = v[:, S].sum(1, keepdims=True)
    w = np.asarray(w).reshape(-1, 1)
    q[:, S] = mass * ((1 - w) * norm(v[:, S]) + w * a)
    return norm(q)


def reliability(p, y, k):
    pred = p.argmax(1)
    return np.array(
        [
            (1 + ((pred == c) & (y == c)).sum()) / (2 + (pred == c).sum())
            for c in range(k)
        ]
    )


def main():
    protocol = json.loads((P / "protocol.json").read_text())
    allrows = [json.loads(x) for x in (P / "scores.jsonl").read_text().splitlines()]
    rows = [r for r in allrows if "modalities" in r]
    assert set(r["actor"] for r in allrows) == set(
        range(2, 7)
    ), "All prespecified actors required"
    assert len({r["id"] for r in allrows}) == len(allrows)
    for actor in range(2, 7):
        assert sum(r["actor"] == actor for r in allrows) == 52, "Incomplete collection"
    y = np.array([LABELS.index(r["true"]) for r in rows])
    actors = np.array([r["actor"] for r in rows])
    a = np.array(
        [
            [r["modalities"]["audio"]["probabilities"][LABELS[c]] for c in S]
            for r in rows
        ]
    )
    v = np.array(
        [[r["modalities"]["image"]["probabilities"][c] for c in LABELS] for r in rows]
    )
    train = np.isin(actors, protocol["train_actors"])
    val = np.isin(actors, protocol["validation_actors"])
    test = np.isin(actors, protocol["test_actors"])
    supported = np.isin(y, S)
    ay = np.array([list(S).index(x) if x in S else -1 for x in y])
    ts = protocol["temperature_grid"]
    ta = min(
        ts,
        key=lambda t: -np.log(
            temperature(a[train & supported], t)[
                np.arange((train & supported).sum()), ay[train & supported]
            ]
        ).mean(),
    )
    tv = min(
        ts,
        key=lambda t: -np.log(
            temperature(v[train], t)[np.arange(train.sum()), y[train]]
        ).mean(),
    )
    ac = temperature(a, ta)
    vc = temperature(v, tv)
    ra = reliability(ac[train & supported], ay[train & supported], 4)
    rv = reliability(vc[train], y[train], 7)
    static = min(
        protocol["weight_grid"],
        key=lambda w: -metrics(y[val], hierarchical(ac[val], vc[val], w))["macro_f1"],
    )

    def adaptive(aa, vv, w, g):
        qa = ra[aa.argmax(1)] * np.maximum(1 - entropy(aa) / np.log(4), 1e-6) ** g
        qv = rv[vv.argmax(1)] * np.maximum(1 - entropy(vv) / np.log(7), 1e-6) ** g
        weights = w * qa / np.maximum(w * qa + (1 - w) * qv, 1e-12)
        return hierarchical(aa, vv, weights)

    choice = min(
        itertools.product(protocol["weight_grid"], protocol["entropy_power_grid"]),
        key=lambda z: -metrics(y[val], adaptive(ac[val], vc[val], *z))["macro_f1"],
    )
    padded = np.zeros_like(v)
    padded[:, S] = a
    legacy = v.copy()
    legacy[:, S] = (v[:, S] + a) / 2
    legacy = norm(legacy)
    methods = {
        "face": v,
        "audio_zero_padded": padded,
        "legacy_support_average": legacy,
        "zero_padded_average": norm(v + padded),
        "calibrated_face": vc,
        "hierarchical_static": hierarchical(ac, vc, static),
        "adaptive_reliability": adaptive(ac, vc, *choice),
    }
    settings = {
        "audio_temperature": ta,
        "face_temperature": tv,
        "static_audio_weight": static,
        "adaptive_prior": choice[0],
        "entropy_power": choice[1],
        "audio_reliability": ra.tolist(),
        "face_reliability": rv.tolist(),
    }
    result = {
        "protocol": protocol,
        "protocol_sha256": hashlib.sha256(
            (P / "protocol.json").read_bytes()
        ).hexdigest(),
        "score_sha256": hashlib.sha256((P / "scores.jsonl").read_bytes()).hexdigest(),
        "parameters": settings,
        "counts": {
            k: int(m.sum())
            for k, m in [("train", train), ("validation", val), ("test", test)]
        },
        "failures": [r for r in allrows if "failure" in r],
        "labels": list(LABELS),
        "validation": {k: metrics(y[val], p[val]) for k, p in methods.items()},
        "test": {k: metrics(y[test], p[test]) for k, p in methods.items()},
        "test_by_actor": {
            str(actor): {
                k: metrics(y[actors == actor], p[actors == actor])
                for k, p in methods.items()
            }
            for actor in protocol["test_actors"]
        },
    }
    contam = norm(0.5 * ac + 0.5 / 4)
    result["stress"] = {
        "missing_audio": metrics(y[test], vc[test]),
        "missing_face": metrics(y[test], padded[test]),
        "uniform_audio_contamination_adaptive": metrics(
            y[test], adaptive(contam[test], vc[test], *choice)
        ),
        "uniform_audio_contamination_static": metrics(
            y[test], hierarchical(contam[test], vc[test], static)
        ),
    }
    rng = np.random.default_rng(20261116)
    deltas = []
    for _ in range(1000):
        sampled = rng.choice(protocol["test_actors"], 2, replace=True)
        ids = np.concatenate([np.flatnonzero(actors == x) for x in sampled])
        deltas.append(
            metrics(y[ids], methods["adaptive_reliability"][ids])["macro_f1"]
            - metrics(y[ids], v[ids])["macro_f1"]
        )
    result["paired_actor_bootstrap_delta_f1"] = {
        "percentile_95": np.percentile(deltas, [2.5, 97.5]).tolist(),
        "replicates": 1000,
        "warning": "Only two actor clusters; descriptive unstable interval, not population inference.",
    }
    predface = v.argmax(1)
    predlegacy = legacy.argmax(1)
    result["legacy_diagnostics"] = {
        "face_correct_fusion_wrong": int(
            ((predface == y) & (predlegacy != y) & test).sum()
        ),
        "face_wrong_fusion_correct": int(
            ((predface != y) & (predlegacy == y) & test).sum()
        ),
        "disagreement_rate": float((predface[test] != predlegacy[test]).mean()),
    }
    result["held_out_predictions"] = [
        {
            "id": r["id"],
            "actor": r["actor"],
            "true": r["true"],
            "scores": {k: p[i].tolist() for k, p in methods.items()},
        }
        for i, r in enumerate(rows)
        if test[i]
    ]
    (P / "results.json").write_text(json.dumps(result, indent=2) + "\n")
    print(
        json.dumps(
            {
                "parameters": settings,
                "counts": result["counts"],
                "test": {
                    k: (x["accuracy"], x["macro_f1"]) for k, x in result["test"].items()
                },
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
