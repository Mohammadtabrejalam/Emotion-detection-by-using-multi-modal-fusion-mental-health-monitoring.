"""
CLI Runner: E01 — Text Unimodal Baseline Training (MindSense Phase 2)
"""

import argparse
from ..text_encoder import TextEncoder
from .common import run_unimodal_training


def main():
    parser = argparse.ArgumentParser(description="E01 Text Baseline Training Runner")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    args = parser.parse_args()

    model_kwargs = {
        "vocab_size": 1000,
        "embed_dim": 64,
        "hidden_dim": 64,
        "num_classes": 7
    }

    run_unimodal_training(
        modality="text",
        model_cls=TextEncoder,
        model_kwargs=model_kwargs,
        experiment_id="E01_Text",
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr
    )


if __name__ == "__main__":
    main()
