"""
CLI Runner: E03 — Vision Unimodal Baseline Training (MindSense Phase 2)
"""

import argparse
from ..vision_encoder import VisionEncoder
from .common import run_unimodal_training


def main():
    parser = argparse.ArgumentParser(description="E03 Vision Baseline Training Runner")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    args = parser.parse_args()

    model_kwargs = {
        "in_channels": 1,
        "hidden_dim": 64,
        "num_classes": 7
    }

    run_unimodal_training(
        modality="vision",
        model_cls=VisionEncoder,
        model_kwargs=model_kwargs,
        experiment_id="E03_Vision",
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr
    )


if __name__ == "__main__":
    main()
