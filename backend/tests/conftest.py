"""Keep API tests away from the developer's database and rate-limit state."""
import os
import sys
import tempfile
from pathlib import Path

import pytest

_database_dir = tempfile.TemporaryDirectory(prefix="mindsense-tests-")
os.environ["MINDSENSE_DATABASE_PATH"] = str(Path(_database_dir.name) / "test.db")


@pytest.fixture(autouse=True)
def reset_rate_limits():
    # Older tests import app.* while newer tests import backend.app.*.
    for name in ("app.rate_limiter", "backend.app.rate_limiter"):
        module = sys.modules.get(name)
        if module:
            module.rate_limiter.history.clear()
