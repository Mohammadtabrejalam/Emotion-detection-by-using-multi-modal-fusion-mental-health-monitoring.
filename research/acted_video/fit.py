"""Train the small video fusion head on development scores from RAVDESS only."""
import argparse
import json
from pathlib import Path

import numpy as np
import sklearn
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score

from backend.app.inference.video_fusion import FACE_LABELS, features, transfer_probabilities
from research.acted_video.manifest import ROOT
from research.paper_v1.study import read_records, digest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT.parents[1] / "backend/app/inference/acted_video_head.json")
    args = parser.parse_args()
    cfg = json.loads((ROOT / "protocol.json").read_text())
    paths = sorted((ROOT.parent / "paper_v1/evidence").glob("development-*/scores.jsonl"))
    actors = cfg["source_fit_actors"] + cfg["source_validation_actors"]
    rows = read_records(paths, actors)
    def samples(selected):
        rows_for_fit = [row for row in rows if row["actor"] in selected and "modalities" in row]
        inputs = [features(row["modalities"]["audio"]["probabilities"], row["modalities"]["image"]["probabilities"])
                  for row in rows_for_fit]
        return inputs, [row["true"] for row in rows_for_fit]
    x_train, y_train = samples(cfg["source_fit_actors"])
    x_val, y_val = samples(cfg["source_validation_actors"])
    best_model, best_score, selected_c = None, -1, None
    trace = []
    for c in cfg["regularization_C"]:
        model = LogisticRegression(C=c, class_weight="balanced", max_iter=2000, tol=1e-8, solver="lbfgs")
        model.fit(x_train, y_train)
        score = f1_score(y_val, model.predict(x_val), labels=FACE_LABELS, average="macro", zero_division=0)
        trace.append({"C": c, "validation_macro_f1": float(score)})
        if score > best_score:
            best_model, best_score, selected_c = model, score, c
    head = {"version": cfg["version"], "labels": best_model.classes_.tolist(),
            "coefficients": best_model.coef_.tolist(), "intercept": best_model.intercept_.tolist(),
            "C": selected_c, "validation": trace, "fit_n": len(y_train), "validation_n": len(y_val),
            "source_sha256": {f"{p.parent.name}/{p.name}": digest(p) for p in paths},
            "protocol_sha256": digest(ROOT / "protocol.json"), "sklearn": sklearn.__version__}
    validation = [row for row in rows if row["actor"] in cfg["source_validation_actors"] and "modalities" in row]
    actual = [list(transfer_probabilities(row["modalities"]["audio"]["probabilities"],
                                          row["modalities"]["image"]["probabilities"], head).values()) for row in validation]
    np.testing.assert_allclose(actual, best_model.predict_proba(x_val), atol=1e-12, rtol=1e-10)
    args.output.write_text(json.dumps(head, indent=2, allow_nan=False) + "\n")
    print(f"Fitted on {len(y_train)}, selected C={selected_c} on {len(y_val)} validation clips.")


if __name__ == "__main__":
    main()
