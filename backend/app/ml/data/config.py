"""
Data Configuration & Path Constants — MindSense
"""

import os
from pathlib import Path

# Workspace base directories
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
DATA_DIR = REPO_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
INTERIM_DATA_DIR = DATA_DIR / "interim"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MANIFESTS_DIR = DATA_DIR / "manifests"
SPLITS_DIR = DATA_DIR / "splits"
METADATA_DIR = DATA_DIR / "metadata"

# Ensure core tracking directories exist
for d in [MANIFESTS_DIR, SPLITS_DIR, METADATA_DIR]:
    d.mkdir(parents=True, exist_ok=True)

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

# Primary Dataset Paths (MELD)
MELD_RAW_DIR = RAW_DATA_DIR / "meld"
MELD_PROCESSED_DIR = PROCESSED_DATA_DIR / "meld"
MELD_MANIFEST_PATH = MANIFESTS_DIR / "meld_manifest.json"
DATASET_STATS_PATH = MANIFESTS_DIR / "dataset_statistics.json"
