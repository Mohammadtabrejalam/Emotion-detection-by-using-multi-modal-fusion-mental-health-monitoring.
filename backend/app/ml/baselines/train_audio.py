"""
CLI Runner: E02 — Audio Unimodal Baseline Training (MindSense Phase 2)
"""

import argparse
from ..audio_encoder import AudioEncoder
from .common import run_unimodal_training


def main():
    parser = argparse.ArgumentParser(description="E02 Audio Baseline Training Runner")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    args = parser.parse_args()

    model_kwargs = {
        "input_dim": 13,
        "hidden_dim": 64,
        "num_classes": 7
    }

    run_unimodal_training(
        modality="audio",
        model_cls=AudioEncoder,
        model_kwargs=model_kwargs,
        experiment_id="E02_Audio",
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr
    )


if __name__ == "__main__":
    main()
