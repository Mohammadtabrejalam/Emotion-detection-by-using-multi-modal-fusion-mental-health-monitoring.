"""Verify complete paired external evidence and report accuracy, uncertainty and latency."""
import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

import numpy as np

from backend.app.inference.video_fusion import AUDIO_LABELS, FACE_LABELS, transfer_probabilities
from research.acted_video.manifest import ROOT


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def distribution(scores, labels):
    if set(scores) != set(labels):
        raise ValueError("Unexpected prediction labels")
    values = np.array([scores[k] for k in labels], dtype=float)
    if not np.isfinite(values).all() or min(values) < 0 or not np.isclose(values.sum(), 1.0):
        raise ValueError("Invalid probability distribution")
    return values


def load_rows(paths, cfg):
    manifest = list(csv.DictReader((ROOT / "clips.csv").read_text().splitlines()))
    expected = {row["filename"]: row for row in manifest}
    actors = Counter(row["actor"] for row in manifest)
    groups = Counter((row["actor"], row["label"]) for row in manifest)
    if len(actors) != cfg["actors"] or len(groups) != len(actors) * len(cfg["target_labels"]) or set(groups.values()) != {cfg["clips_per_actor_per_label"]}:
        raise ValueError("Unbalanced or incomplete external manifest")
    seen = {}
    head = ROOT.parents[1] / "backend/app/inference/acted_video_head.json"
    hashes = {p.name: sha256(p) for p in (ROOT / "protocol.json", ROOT / "clips.csv", head)}
    pinned = json.loads((ROOT.parent / "paper_v1/protocol.json").read_text())["models"]
    for path in paths:
        metadata = json.loads(path.with_suffix(".meta.json").read_text())
        if metadata["hashes"] != hashes:
            raise ValueError("Protocol, test manifest or fitted head has changed")
        for key, model in pinned.items():
            actual = metadata["models"][key]
            if actual["repo"] != model["model"] or actual["revision"] != model["revision"]:
                raise ValueError("Unexpected model revision")
        for line in path.read_text().splitlines():
            row = json.loads(line)
            name = row["filename"]
            if name in seen or name not in expected or any(row[k] != v for k, v in expected[name].items()):
                raise ValueError(f"Duplicate or unexpected clip: {name}")
            for method in ("midpoint", "sequence"):
                sample = row[method]
                if not np.isfinite(sample["seconds"]) or sample["seconds"] <= 0:
                    raise ValueError("Invalid wall time")
                if "input_error" in sample:
                    if any(k in sample for k in ("face", "legacy", "transfer")):
                        raise ValueError("Failed trial contains predictions")
                    continue
                audio = distribution(sample["audio"], AUDIO_LABELS)
                face = distribution(sample["face"], FACE_LABELS)
                legacy = face.copy()
                for idx, label in enumerate(AUDIO_LABELS):
                    j = FACE_LABELS.index(label)
                    legacy[j] = (legacy[j] + audio[idx]) / 2
                np.testing.assert_allclose(distribution(sample["legacy"], FACE_LABELS), legacy / legacy.sum(), atol=1e-8)
                learned = transfer_probabilities(sample["audio"], sample["face"])
                np.testing.assert_allclose(distribution(sample["transfer"], FACE_LABELS), distribution(learned, FACE_LABELS), atol=1e-8)
            seen[name] = row
    if set(seen) != set(expected):
        raise ValueError(f"Expected {len(expected)} one-to-one clip records, found {len(seen)}")
    return [seen[row["filename"]] for row in manifest]


def metrics(rows, method, targets):
    sampling, rule = method.split("_")
    probabilities = np.array([distribution(row[sampling][rule], FACE_LABELS) for row in rows])
    y = np.array([FACE_LABELS.index(row["label"]) for row in rows])
    pred = probabilities.argmax(axis=1)
    cm = np.zeros((len(FACE_LABELS), len(FACE_LABELS)), dtype=int)
    np.add.at(cm, (y, pred), 1)
    indices = [FACE_LABELS.index(label) for label in targets]
    count = cm.sum(1) + cm.sum(0)
    f1 = np.divide(2 * np.diag(cm), count, out=np.zeros(len(count)), where=count > 0)
    return {"correct": int(np.sum(y == pred)), "n": len(y), "accuracy": float(np.mean(y == pred)),
            "macro_f1": float(np.mean(f1[indices])), "per_target_f1": dict(zip(targets, f1[indices].tolist())),
            "nll": float(-np.mean(np.log(np.maximum(probabilities[np.arange(len(y)), y], 1e-12)))),
            "brier": float(np.mean(np.sum((probabilities - np.eye(len(FACE_LABELS))[y]) ** 2, axis=1))),
            "confusion": cm.tolist()}


def macro_from_counts(cm, indices):
    den = cm.sum(-1) + cm.sum(-2)
    scores = np.divide(2 * np.diagonal(cm, axis1=-2, axis2=-1), den,
                       out=np.zeros_like(den, dtype=float), where=den > 0)
    return scores[..., indices].mean(-1)


def summarize(rows, cfg):
    targets = cfg["target_labels"]
    modes = ["midpoint", "sequence"]
    successes = {m: [r for r in rows if "input_error" not in r[m]] for m in modes}
    paired = [r for r in rows if all("input_error" not in r[m] for m in modes)]
    if not paired:
        raise ValueError("No usable paired clips. Report input failures before attempting accuracy claims.")
    methods = cfg["comparisons"]
    study = {name: metrics(paired, name, targets) for name in methods}
    all_attempts = {}
    for name in methods:
        mode = name.split("_")[0]
        ok = successes[mode]
        correct = metrics(ok, name, targets)["correct"]
        all_attempts[name] = {"attempted": len(rows), "accepted": len(ok), "correct": correct,
                              "accuracy_including_failures": correct / len(rows)}
    by_actor = {}
    for actor in sorted({r["actor"] for r in rows}):
        subset = [r for r in paired if r["actor"] == actor]
        by_actor[actor] = {name: metrics(subset, name, targets) for name in methods} if subset else {}
    actors_with_pairs = [a for a in by_actor if by_actor[a]]
    baseline, primary = "midpoint_legacy", "sequence_transfer"
    indexes = [FACE_LABELS.index(label) for label in targets]
    rng = np.random.default_rng(20261118)
    draw = rng.integers(len(actors_with_pairs), size=(5000, len(actors_with_pairs)))
    def replicate(name):
        cms = np.array([by_actor[a][name]["confusion"] for a in actors_with_pairs])
        return macro_from_counts(cms[draw].sum(1), indexes)
    interval = np.quantile(replicate(primary) - replicate(baseline), [0.025, 0.975])
    timing = {}
    for method in [baseline, "sequence_legacy", primary]:
        mode = method.split("_")[0]
        times = [r[mode]["seconds"] + (r[mode]["transfer_seconds"] if method == primary else 0) for r in paired]
        timing[method] = {"p50_seconds": float(np.median(times)), "p95_seconds": float(np.quantile(times, 0.95))}
    failures = {mode: dict(Counter(r[mode]["input_error"] for r in rows if "input_error" in r[mode])) for mode in modes}
    return {"n_attempted": len(rows), "n_paired": len(paired), "n_actors": len(actors_with_pairs),
            "label_order": list(FACE_LABELS), "target_labels": targets,
            "paired": study, "all_attempts": all_attempts, "input_failures": failures,
            "actors": by_actor, "latency_on_pairs": timing,
            "primary": {"contrast": f"{primary} minus {baseline}",
                        "delta_macro_f1": study[primary]["macro_f1"] - study[baseline]["macro_f1"],
                        "actor_bootstrap_95": interval.tolist(), "replicates": len(draw), "seed": 20261118}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scores", nargs="+", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    cfg = json.loads((ROOT / "protocol.json").read_text())
    rows = load_rows(args.scores, cfg)
    result = summarize(rows, cfg)
    result["score_hashes"] = {p.parent.name: sha256(p) for p in args.scores}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n")
    print(json.dumps({key: result[key] for key in ("n_attempted", "n_paired", "n_actors", "primary", "latency_on_pairs")}, indent=2))


if __name__ == "__main__":
    main()
