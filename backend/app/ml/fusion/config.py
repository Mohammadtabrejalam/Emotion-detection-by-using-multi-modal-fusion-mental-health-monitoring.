"""
Phase 3 Multimodal Fusion Configuration & Hyperparameters — MindSense
"""

import os
import random
from pathlib import Path
from typing import Dict, Any, List
import numpy as np
import torch

# Directory Resolution
FUSION_DIR = Path(__file__).resolve().parent
ML_DIR = FUSION_DIR.parent
APP_DIR = ML_DIR.parent
BACKEND_DIR = APP_DIR.parent
REPO_ROOT = BACKEND_DIR.parent

# Data & Artifact Paths
DATA_MANIFEST_PATH = REPO_ROOT / "data" / "manifests" / "meld_manifest.json"
BASELINES_ARTIFACTS_DIR = REPO_ROOT / "artifacts" / "baselines"
ARTIFACTS_DIR = REPO_ROOT / "artifacts" / "fusion"

# Structured Artifact Subdirectories
CHECKPOINTS_DIR = ARTIFACTS_DIR / "checkpoints"
ABLATIONS_DIR = ARTIFACTS_DIR / "ablations"
METRICS_DIR = ARTIFACTS_DIR / "metrics"
CONFUSION_MATRICES_DIR = ARTIFACTS_DIR / "confusion_matrices"
HISTORY_DIR = ARTIFACTS_DIR / "training_history"
CONFIGS_DIR = ARTIFACTS_DIR / "configuration"
FULL_FUSION_DIR = ARTIFACTS_DIR / "full"

# Ensure directories exist
for d in [
    ARTIFACTS_DIR, CHECKPOINTS_DIR, ABLATIONS_DIR, METRICS_DIR,
    CONFUSION_MATRICES_DIR, HISTORY_DIR, CONFIGS_DIR, FULL_FUSION_DIR
]:
    d.mkdir(parents=True, exist_ok=True)

# Phase 2 Pretrained Checkpoint Paths
PRETRAINED_CHECKPOINTS = {
    "text": BASELINES_ARTIFACTS_DIR / "text" / "best_model.pt",
    "audio": BASELINES_ARTIFACTS_DIR / "audio" / "best_model.pt",
    "vision": BASELINES_ARTIFACTS_DIR / "vision" / "best_model.pt"
}

# Fusion Hyperparameters (Protocol aligned with Phase 2)
RANDOM_SEED = 42
EPOCHS = 15
BATCH_SIZE = 32
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
EARLY_STOPPING_PATIENCE = 4
DROPOUT = 0.1
D_MODEL = 64
NHEAD = 4

# Class Definitions
EMOTION_CLASSES = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
NUM_CLASSES = 7

# Seven Systematic Ablation Configurations
ABLATION_CONFIGS: Dict[str, Dict[str, Any]] = {
    "T": {
        "name": "Text only",
        "active_modalities": ["text"],
        "masked_modalities": ["audio", "vision"]
    },
    "A": {
        "name": "Audio only",
        "active_modalities": ["audio"],
        "masked_modalities": ["text", "vision"]
    },
    "V": {
        "name": "Vision only",
        "active_modalities": ["vision"],
        "masked_modalities": ["text", "audio"]
    },
    "T+A": {
        "name": "Text + Audio",
        "active_modalities": ["text", "audio"],
        "masked_modalities": ["vision"]
    },
    "T+V": {
        "name": "Text + Vision",
        "active_modalities": ["text", "vision"],
        "masked_modalities": ["audio"]
    },
    "A+V": {
        "name": "Audio + Vision",
        "active_modalities": ["audio", "vision"],
        "masked_modalities": ["text"]
    },
    "T+A+V": {
        "name": "Text + Audio + Vision (Full)",
        "active_modalities": ["text", "audio", "vision"],
        "masked_modalities": []
    }
}


def get_device() -> torch.device:
    """Returns CUDA device if available, otherwise CPU."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def set_seed(seed: int = RANDOM_SEED) -> None:
    """Ensures deterministic, reproducible execution."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
