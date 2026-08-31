"""
Data Configuration & Dynamic Path Resolution — MindSense
Version: 1.1.0 (Real Dataset Pipeline)
"""

import os
from pathlib import Path
from typing import Optional, Union

# Workspace base directories (dynamically resolved relative to this module)
ML_DATA_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ML_DATA_DIR.parent.parent.parent
REPO_ROOT = BACKEND_DIR.parent

DATA_DIR = REPO_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
INTERIM_DATA_DIR = DATA_DIR / "interim"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MANIFESTS_DIR = DATA_DIR / "manifests"
SPLITS_DIR = DATA_DIR / "splits"
METADATA_DIR = DATA_DIR / "metadata"
DEMO_DATA_DIR = DATA_DIR / "demo"

# Ensure core directories exist
for d in [MANIFESTS_DIR, SPLITS_DIR, METADATA_DIR, DEMO_DATA_DIR, RAW_DATA_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Configurable MELD root directory
# Resolved in priority order:
# 1. Explicit argument in functions
# 2. Environment variable MINDSENSE_MELD_ROOT
# 3. Default relative directory: data/raw/meld
def get_meld_root(custom_path: Optional[Union[str, Path]] = None) -> Path:
    """
    Resolves the root directory of the MELD dataset.
    Never uses machine-specific hardcoded paths.
    """
    if custom_path:
        return Path(custom_path).resolve()
    
    env_path = os.environ.get("MINDSENSE_MELD_ROOT")
    if env_path and env_path.strip():
        return Path(env_path.strip()).resolve()
    
    return (RAW_DATA_DIR / "meld").resolve()

# Audio Preprocessing Specs
AUDIO_SAMPLE_RATE = 16000
AUDIO_TARGET_FRAMES = 200
AUDIO_NUM_MFCC = 13
AUDIO_FRAME_SIZE = 0.025  # 25 ms
AUDIO_FRAME_STRIDE = 0.010  # 10 ms

# Vision Preprocessing Specs
VISION_IMAGE_SIZE = (48, 48)
VISION_NUM_CHANNELS = 1

# Text Preprocessing Specs
TEXT_MAX_LENGTH = 64
TEXT_VOCAB_SIZE = 1000

# Manifest Paths
MELD_MANIFEST_PATH = MANIFESTS_DIR / "meld_manifest.json"
DATASET_STATS_PATH = MANIFESTS_DIR / "dataset_statistics.json"
DEMO_MANIFEST_PATH = DEMO_DATA_DIR / "demo_manifest.json"

# Official MELD Benchmark Targets (ACL 2019)
MELD_OFFICIAL_COUNTS = {
    "total_utterances": 13708,
    "train_utterances": 9989,
    "dev_utterances": 1109,
    "test_utterances": 2610,
    "total_dialogues": 1433,
    "classes": 7
}
