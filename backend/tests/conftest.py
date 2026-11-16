"""Keep API tests away from the developer's database and rate-limit state."""
import os
import sys
import tempfile
from pathlib import Path

import pytest

_database_dir = tempfile.TemporaryDirectory(prefix="mindsense-tests-")
os.environ["MINDSENSE_TEST_MODE"] = "1"
os.environ["MINDSENSE_DATABASE_PATH"] = str(Path(_database_dir.name) / "test.db")


@pytest.fixture(autouse=True)
def reset_rate_limits():
    # Older tests import app.* while newer tests import backend.app.*.
    for name in ("app.rate_limiter", "backend.app.rate_limiter"):
        module = sys.modules.get(name)
        if module:
            module.rate_limiter.history.clear()

@pytest.fixture(autouse=True)
def isolated_classifier_double(request, monkeypatch):
    """API tests exercise routing/storage; real checkpoint tests use a fresh engine.

    This test-only double is never imported by the application.
    """
    if request.node.get_closest_marker('real_models'):
        return
    from backend.app.inference.registry import LABELS
    def predict(kind, value):
        labels = ('happy', 'sad', 'angry', 'neutral') if kind == 'audio' else LABELS
        scores = {label: (0.8 if label == 'happy' else 0.2/(len(labels)-1)) for label in labels}
        return {'emotion': 'happy', 'confidence': 0.8, 'probabilities': scores,
                'model': 'TEST_ONLY_CLASSIFIER_DOUBLE', 'revision': 'test'}
    for name in ('app.inference.service', 'backend.app.inference.service'):
        module = sys.modules.get(name)
        if module:
            monkeypatch.setattr(module.engine, '_predict', predict)
