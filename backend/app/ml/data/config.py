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
    Resolved in priority order:
    1. Explicit custom_path argument
    2. Environment variable MINDSENSE_MELD_ROOT
    3. RAW_DATA_DIR / "meld" if split directories exist
    4. User Desktop MELD_DOWNLOAD path (~/Desktop/MELD_DOWNLOAD/MELD.Raw) if exists
    5. Default relative directory: data/raw/meld
    """
    if custom_path:
        return Path(custom_path).resolve()
    
    env_path = os.environ.get("MINDSENSE_MELD_ROOT")
    if env_path and env_path.strip():
        return Path(env_path.strip()).resolve()

    # Check if data/raw/meld has split directories
    repo_meld = (RAW_DATA_DIR / "meld").resolve()
    if (repo_meld / "train_splits").exists():
        return repo_meld

    # Fallback to local user download folder if present
    user_meld = Path(os.path.expanduser(r"~\Desktop\MELD_DOWNLOAD\MELD.Raw")).resolve()
    if user_meld.exists():
        return user_meld
    
    return repo_meld


def get_ravdess_root(custom_path: Optional[Union[str, Path]] = None) -> Path:
    """
    Resolves the root directory of the RAVDESS dataset.
    Resolved in priority order:
    1. Explicit custom_path argument
    2. Environment variable MINDSENSE_RAVDESS_ROOT
    3. RAW_DATA_DIR / "ravdess" if directory has content
    4. Fallback to local user Downloads folder (~/Downloads/ravdess) if exists
    5. Default relative directory: data/raw/ravdess
    """
    if custom_path:
        return Path(custom_path).resolve()

    env_path = os.environ.get("MINDSENSE_RAVDESS_ROOT")
    if env_path and env_path.strip():
        return Path(env_path.strip()).resolve()

    repo_ravdess = (RAW_DATA_DIR / "ravdess").resolve()
    if repo_ravdess.exists() and any(repo_ravdess.iterdir()):
        return repo_ravdess

    user_ravdess = Path(os.path.expanduser(r"~\Downloads\ravdess")).resolve()
    if user_ravdess.exists() and any(user_ravdess.iterdir()):
        return user_ravdess

    return repo_ravdess

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
RAVDESS_MANIFEST_PATH = MANIFESTS_DIR / "ravdess_manifest.json"
RAVDESS_STATS_PATH = MANIFESTS_DIR / "ravdess_statistics.json"

# Official MELD Benchmark Targets (ACL 2019)
MELD_OFFICIAL_COUNTS = {
    "total_utterances": 13708,
    "train_utterances": 9989,
    "dev_utterances": 1109,
    "test_utterances": 2610,
    "total_dialogues": 1433,
    "classes": 7
}

# Official RAVDESS Speech Benchmark Targets (7-Class Ekman/MELD Zero-Shot)
RAVDESS_OFFICIAL_COUNTS = {
    "total_speech_audio": 1440,
    "excluded_calm": 192,
    "eligible_trials": 1248,
    "actors": 24,
    "classes": 7
}
