"""
Phase 2 Unimodal Baseline Configuration & Hyperparameters — MindSense
"""

import os
import random
import torch
import numpy as np
from pathlib import Path

# Workspace Root & Data Paths
BASELINES_DIR = Path(__file__).resolve().parent
ML_DIR = BASELINES_DIR.parent
APP_DIR = ML_DIR.parent
BACKEND_DIR = APP_DIR.parent
REPO_ROOT = BACKEND_DIR.parent

DATA_MANIFEST_PATH = REPO_ROOT / "data" / "manifests" / "meld_manifest.json"
ARTIFACTS_DIR = REPO_ROOT / "artifacts" / "baselines"

# Baseline Hyperparameters
RANDOM_SEED = 42
EPOCHS = 15
BATCH_SIZE = 32
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
EARLY_STOPPING_PATIENCE = 4

# Class Definitions
EMOTION_CLASSES = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
NUM_CLASSES = 7

# Device Selection
def get_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")

# Reproducibility Seed Setting
def set_seed(seed: int = RANDOM_SEED) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
