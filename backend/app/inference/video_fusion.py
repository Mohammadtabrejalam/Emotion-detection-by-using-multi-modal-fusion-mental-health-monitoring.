"""A compact, reproducible fusion head fitted on source-dataset model scores."""
import json
from functools import lru_cache
from pathlib import Path

import numpy as np

AUDIO_LABELS = ("happy", "sad", "angry", "neutral")
FACE_LABELS = ("happy", "sad", "angry", "fear", "surprise", "disgust", "neutral")


def features(audio, face):
    groups = []
    for scores, labels in [(audio, AUDIO_LABELS), (face, FACE_LABELS)]:
        if set(scores) != set(labels):
            raise ValueError("Unexpected model label set")
        values = np.asarray([scores[label] for label in labels], dtype=float)
        if not np.isfinite(values).all() or np.any(values < 0) or not np.isclose(values.sum(), 1):
            raise ValueError("Expected normalized expert scores")
        logarithms = np.log(np.maximum(values, 1e-8))
        groups.append(logarithms - logarithms.mean())
    return np.concatenate(groups)


@lru_cache(maxsize=1)
def fitted_head():
    return json.loads(Path(__file__).with_name("acted_video_head.json").read_text())


def transfer_probabilities(audio, face, head=None):
    head = fitted_head() if head is None else head
    logits = np.asarray(head["coefficients"]) @ features(audio, face) + head["intercept"]
    values = np.exp(logits - logits.max())
    return dict(zip(head["labels"], (values / values.sum()).tolist()))
