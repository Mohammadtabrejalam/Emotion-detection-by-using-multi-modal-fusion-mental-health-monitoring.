"""
Multimodal Fusion Package — MindSense Phase 3
"""

from .config import (
    DATA_MANIFEST_PATH, ARTIFACTS_DIR, BASELINES_ARTIFACTS_DIR,
    PRETRAINED_CHECKPOINTS, RANDOM_SEED, EPOCHS, BATCH_SIZE,
    LEARNING_RATE, WEIGHT_DECAY, EARLY_STOPPING_PATIENCE,
    DROPOUT, D_MODEL, NHEAD, EMOTION_CLASSES, NUM_CLASSES,
    ABLATION_CONFIGS, get_device, set_seed
)
from .model import MultimodalFusionTransformer
from .train import run_fusion_training
from .evaluate import evaluate_fusion_model
from .ablation import run_ablation_study

__all__ = [
    "MultimodalFusionTransformer",
    "run_fusion_training",
    "evaluate_fusion_model",
    "run_ablation_study",
    "DATA_MANIFEST_PATH",
    "ARTIFACTS_DIR",
    "BASELINES_ARTIFACTS_DIR",
    "PRETRAINED_CHECKPOINTS",
    "RANDOM_SEED",
    "EPOCHS",
    "BATCH_SIZE",
    "LEARNING_RATE",
    "WEIGHT_DECAY",
    "EARLY_STOPPING_PATIENCE",
    "DROPOUT",
    "D_MODEL",
    "NHEAD",
    "EMOTION_CLASSES",
    "NUM_CLASSES",
    "ABLATION_CONFIGS",
    "get_device",
    "set_seed"
]
