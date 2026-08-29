# Current Machine Learning Data Pipeline Audit — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 1 Baseline Audit)  
**Date**: August 2026  
**Status**: Documented  

---

## 1. Executive Overview

This document provides a technical audit of the current prototype data pipeline in `backend/app/ml/`. It details the existing tensor specifications, input formats, unimodal encoder expectations, preprocessing modules, and synthetic data dependencies prior to the implementation of the real-dataset pipeline.

---

## 2. Granular Modality Specifications & Tensor Contracts

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT PROTOTYPE TENSOR CONTRACT                               │
├──────────┬─────────────────────────────┬───────────────────┬───────────────────────────┤
│ Modality │ Raw Format                  │ Preprocessed Form │ Tensor Shape (Batch)      │
├──────────┼─────────────────────────────┼───────────────────┼───────────────────────────┤
│ Text     │ UTF-8 plain text string     │ 64 token IDs      │ `(batch_size, 64)`        │
│          │ (journal / utterance)       │ (vocab size 1000) │ `torch.int64`             │
├──────────┼─────────────────────────────┼───────────────────┼───────────────────────────┤
│ Audio    │ 16 kHz Mono PCM WAV         │ 13 MFCC channels  │ `(batch_size, 200, 13)`   │
│          │ (or FFmpeg converted)       │ 200 time frames   │ `torch.float32`           │
├──────────┼─────────────────────────────┼───────────────────┼───────────────────────────┤
│ Vision   │ JPEG / PNG / WebP image     │ 48x48 grayscale   │ `(batch_size, 1, 48, 48)` │
│          │ (face crop / webcam frame)  │ normalized [0, 1] │ `torch.float32`           │
└──────────┴─────────────────────────────┴───────────────────┴───────────────────────────┘
```

---

### 2.1 Text Pipeline
- **Module**: `backend/app/ml/preprocessing/text.py` & `text_encoder.py`
- **Lexicon**: Hardcoded 1,000-word vocabulary `VOCAB` (`<pad>=0`, `<unk>=1`, functional stopwords, affective keywords, crisis terms).
- **Tokenization**: Lowercasing, regex punctuation stripping, whitespace normalization, word-to-index lookup, fixed truncation/padding to sequence length $L=64$.
- **Model Architecture**:
  - `nn.Embedding(vocab_size=1000, embed_dim=64, padding_idx=0)`
  - 1D-CNN: $\text{Conv1D}(64 \to 64, k=3, p=1) \to \text{ReLU} \to \text{Conv1D}(64 \to 64, k=3, p=1) \to \text{ReLU}$
  - Temporal Pooling: `AdaptiveMaxPool1d(1)` $\to$ Embedding vector $e_t \in \mathbb{R}^{64}$
  - Unimodal Logits: `Linear(64, num_classes=7)`.

---

### 2.2 Audio Pipeline
- **Module**: `backend/app/ml/preprocessing/audio.py` & `audio_encoder.py`
- **Signal Extraction**:
  - Resampling to 16,000 Hz single-channel mono PCM.
  - Framing: Frame size 25 ms (400 samples), frame stride 10 ms (160 samples), Hamming window.
  - Spectral Transform: 512-point FFT $\to$ 26 Mel filterbanks $\to$ Discrete Cosine Transform (DCT-II) $\to$ 13 MFCC coefficients.
  - Duration Normalization: Padded with zeros or truncated to 200 frames (~2.0 seconds).
- **Model Architecture**:
  - 3-layer 1D-CNN over feature frames with BatchNorm1d and MaxPool1d:
    - $\text{Conv1D}(13 \to 32, k=5, p=2) \to \text{BN} \to \text{ReLU} \to \text{MaxPool}(2)$
    - $\text{Conv1D}(32 \to 64, k=5, p=2) \to \text{BN} \to \text{ReLU} \to \text{MaxPool}(2)$
    - $\text{Conv1D}(64 \to 64, k=3, p=1) \to \text{BN} \to \text{ReLU}$
  - Pooling: `AdaptiveAvgPool1d(1)` $\to$ Embedding vector $e_a \in \mathbb{R}^{64}$
  - Unimodal Logits: `Linear(64, num_classes=7)`.

---

### 2.3 Vision Pipeline
- **Module**: `backend/app/ml/preprocessing/vision.py` & `vision_encoder.py`
- **Image Processing**:
  - Grayscale conversion (1 channel).
  - OpenCV Haar Cascade `haarcascade_frontalface_default.xml` face detection.
  - Fallback: Center square crop if face detector is uninitialized.
  - Resizing: Bilinear interpolation to $48 \times 48$ pixels.
  - Normalization: Scaled from $[0, 255]$ to $[0.0, 1.0]$.
- **Model Architecture**:
  - 3-layer 2D-CNN with BatchNorm2d and MaxPool2d:
    - $\text{Conv2D}(1 \to 32, k=3, p=1) \to \text{BN} \to \text{ReLU} \to \text{MaxPool}(2)$
    - $\text{Conv2D}(32 \to 64, k=3, p=1) \to \text{BN} \to \text{ReLU} \to \text{MaxPool}(2)$
    - $\text{Conv2D}(64 \to 64, k=3, p=1) \to \text{BN} \to \text{ReLU}$
  - Pooling: `AdaptiveAvgPool2d((1, 1))` $\to$ Embedding vector $e_v \in \mathbb{R}^{64}$
  - Unimodal Logits: `Linear(64, num_classes=7)`.

---

### 2.4 Intermediate Fusion Transformer
- **Module**: `backend/app/ml/fusion_model.py`
- **Sequence Formation**:
  - Modality tokens stacked: $S = [e_t, e_a, e_v] \in \mathbb{R}^{\text{batch} \times 3 \times 64}$.
  - Added learnable modality embeddings: $P \in \mathbb{R}^{1 \times 3 \times 64}$.
- **Attention & Masking**:
  - `nn.MultiheadAttention(embed_dim=64, num_heads=4, batch_first=True)`
  - Mask: `key_padding_mask` of shape `(batch, 3)` where `True` indicates a missing modality.
- **Active Token Pooling**:
  - Sums active token representations and divides by count of non-masked modalities.
- **Classification Head**:
  - $\text{Linear}(64 \to 32) \to \text{ReLU} \to \text{Dropout}(0.1) \to \text{Linear}(32 \to 7)$.

---

## 3. Existing Dataset & Training Implementation

- **Dataset Class**: `SyntheticEmotionDataset(Dataset)` in `backend/app/ml/train.py`
  - Generates random uniform integers for text indices (`torch.randint(0, 1000, (100, 64))`).
  - Generates random Gaussian noise for audio (`torch.randn(100, 200, 13)`).
  - Generates random Gaussian noise for vision (`torch.randn(100, 1, 48, 48)`).
  - Generates random labels ($0$ to $6$).
- **DataLoader**: Standard `torch.utils.data.DataLoader` with batch size 10 and default collate function.
- **Evaluation Simulation**: Evaluates random split on synthetic validation tensors ($N=20$) and blends with hardcoded float constants ($0.3 \times \text{val\_acc} + 0.7 \times \text{base\_perf}$).

---

## 4. Deficiencies Requiring Replacement in Phase 1

1. **No Real Data Provenance**: Synthetic dataset lacks real acoustic resonance, authentic facial expression dynamics, and real natural language syntax.
2. **Missing Sample Metadata**: No tracking of speaker IDs, session IDs, utterance timestamps, or dataset source origins.
3. **No Speaker-Independent Partitioning**: Training and validation sets are randomly split without regard to participant identity.
4. **Simplistic Collate Function**: Default PyTorch collator assumes uniform tensor sizes and cannot handle missing modality dictionaries cleanly without manual `None` checks.
5. **No Data Validation Guardrails**: No detection of corrupt media, missing modality pairs, or duplicate sample references.
