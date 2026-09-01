# Phase 2 Completion Report — Real Baseline Models

**Project:** MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Phase:** Phase 2 — Real Baseline Models  
**Status:** COMPLETE & VERIFIED

## 1. Objective

Phase 2 establishes independent unimodal baselines on the real MELD dataset before multimodal fusion. Three experiments were executed independently:

- E01 — Text baseline
- E02 — Audio baseline
- E03 — Vision baseline

The baselines provide the reference performance against which later multimodal fusion experiments will be compared.

## 2. Dataset

Dataset: Official MELD corpus.

The validated MELD manifest contains 13,708 samples across train, validation, and test splits. The baseline runs use the existing validated manifest and preserve the held-out test split for final evaluation.

For the baseline training runs, one corrupted MELD media sample (`dia125_utt3.mp4`) was explicitly excluded from training for Audio and Vision. No silent zero-data replacement was used.

## 3. Training Protocol

Common protocol:

- PyTorch models
- AdamW optimizer
- Learning rate: 0.001
- Weight decay: 0.0001
- Batch size: 32
- Seed: 42
- CrossEntropyLoss with class weights computed only from the training split
- Best checkpoint selected by validation Macro-F1
- Early stopping based on validation Macro-F1
- Test set kept untouched during training

## 4. Model Baselines

### E01 — Text

The text baseline uses the repository's `TextEncoder` and consumes only the text modality.

Final test results:

- Accuracy: 20.61%
- Macro-F1: 0.1724
- Weighted-F1: 0.2035
- Macro-Precision: 0.2133
- Macro-Recall: 0.2314
- Test samples: 2,610

### E02 — Audio

The audio baseline uses the repository's `AudioEncoder`. Real MELD MP4 audio streams are decoded to 16 kHz mono PCM and converted to MFCC features with shape `(200, 13)`.

Training selected epoch 9 as the best checkpoint with validation Macro-F1 of 0.2246 and stopped early at epoch 13.

Final test results:

- Accuracy: 29.85%
- Macro-F1: 0.2191
- Weighted-F1: 0.3337
- Macro-Precision: 0.2370
- Macro-Recall: 0.2491
- Test samples: 2,610

### E03 — Vision

The vision baseline uses the repository's `VisionEncoder` and consumes visual input derived from the real MELD MP4 media.

The interrupted run was resumed from the best checkpoint at epoch 2. The resumed training improved the checkpoint at epoch 3 with validation Macro-F1 of 0.1052 and stopped early at epoch 7.

Final test results:

- Accuracy: 23.95%
- Macro-F1: 0.1096
- Weighted-F1: 0.2432
- Macro-Precision: 0.1079
- Macro-Recall: 0.1330
- Test samples: 2,610

## 5. Baseline Comparison

| Modality | Accuracy | Macro-F1 | Weighted-F1 |
|---|---:|---:|---:|
| Text | 20.61% | 0.1724 | 0.2035 |
| Audio | **29.85%** | **0.2191** | **0.3337** |
| Vision | 23.95% | 0.1096 | 0.2432 |

Audio is the strongest of the three baselines by Macro-F1. Vision is the weakest unimodal baseline on Macro-F1.

Because the MELD class distribution is imbalanced, Macro-F1 should be treated as a primary comparison metric rather than relying on accuracy alone.

## 6. Validation & Reproducibility

The Phase 2 test suite was executed after implementing checkpoint resume and the final checkpoint-integrity test fix:

`36 passed in 5.61s`

The tests cover modality isolation, train-only class weights, metric calculations, checkpoint resume behavior, MELD ingestion, media validation, audio extraction, preprocessing, and dataset integrity.

## 7. Research Interpretation

These results establish the unimodal reference points required for Phase 3. No claim of multimodal improvement can be made yet because the fusion model has not been evaluated.

The next research stage is:

**Phase 3 — Multimodal Fusion**

The target comparison will be:

`Text + Audio + Vision` versus the three unimodal baselines above, using the same held-out test protocol.

## 8. Completion Checklist

- [x] Real MELD data used
- [x] Text baseline trained and evaluated
- [x] Audio baseline trained and evaluated
- [x] Vision baseline trained and evaluated
- [x] Test metrics generated from actual predictions
- [x] Confusion matrices generated
- [x] Training histories saved
- [x] Checkpoint resume implemented and tested
- [x] Test leakage avoided during model selection
- [x] Phase 2 tests passing (36/36)
- [x] Baseline comparison recorded

**Phase 2 — COMPLETE.**
