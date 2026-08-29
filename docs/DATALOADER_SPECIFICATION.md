# Multimodal DataLoader & Batching Specification — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 1 DataLoader Specification)  
**Date**: August 2026  
**Status**: Formal Specification  

---

## 1. Overview

This document specifies the exact tensor contracts, dictionary structures, batch collate logic, and missing-modality handling rules implemented by `MultimodalEmotionDataset` and `multimodal_collate_fn` in `backend/app/ml/data/dataset.py`.

---

## 2. Granular Tensor Contracts & Batch Shapes

When querying `DataLoader(dataset, batch_size=B, collate_fn=multimodal_collate_fn)`, the returned batch dictionary satisfies:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               BATCHED TENSOR CONTRACT                                  │
├─────────────────┬──────────────────────────┬───────────────┬───────────────────────────┤
│ Key             │ Shape                    │ Dtype         │ Description               │
├─────────────────┼──────────────────────────┼───────────────┼───────────────────────────┤
│ `"text"`        │ `(B, 64)`                │ `torch.int64` │ 64 token IDs per sequence │
│ `"audio"`       │ `(B, 200, 13)`           │ `torch.float32`│ 200 frames of 13 MFCCs    │
│ `"vision"`      │ `(B, 1, 48, 48)`         │ `torch.float32`│ Grayscale face crops [0,1]│
│ `"label"`       │ `(B,)`                   │ `torch.int64` │ Ground-truth class ID 0..6│
│ `"modality_mask"`│ `(B, 3)`                │ `torch.float32`│ [has_t, has_a, has_v]     │
│ `"sample_ids"`  │ `List[str]` of len `B`   │ Python `str`  │ Unique global sample IDs  │
│ `"speaker_ids"` │ `List[str]` of len `B`   │ Python `str`  │ Provenance speaker IDs    │
│ `"datasets"`    │ `List[str]` of len `B`   │ Python `str`  │ Source corpus identifier  │
│ `"metadata"`    │ `List[dict]` of len `B`  │ Python `dict` │ Split, duration, original │
└─────────────────┴──────────────────────────┴───────────────┴───────────────────────────┘
```

---

## 3. Missing-Modality Masking Dynamics

When a sample possesses missing sensory channels:
- **Case 1: Full Triples Available ($T + A + V$)**:
  `modality_mask[i] = [1.0, 1.0, 1.0]`
- **Case 2: Text + Audio Available, Vision Missing ($T + A$)**:
  `modality_mask[i] = [1.0, 1.0, 0.0]`
  - `vision[i]` is populated with clean zero tensors $\mathbf{0}^{1 \times 48 \times 48}$.
  - The model cross-attention mask directly consumes `key_padding_mask = (modality_mask == 0.0)`.
- **Case 3: Text Only ($T$)**:
  `modality_mask[i] = [1.0, 0.0, 0.0]`
- **Case 4: Audio Only ($A$)**:
  `modality_mask[i] = [0.0, 1.0, 0.0]`

> [!NOTE]
> No synthetic random noise or imputed fake features are generated for missing modalities. The zero tensor serves strictly as a static container while the boolean/float mask directs attention computation.

---

## 4. PyTorch DataLoader Usage Example

```python
from torch.utils.data import DataLoader
from backend.app.ml.data import MultimodalEmotionDataset, multimodal_collate_fn

# 1. Instantiate train dataset
train_dataset = MultimodalEmotionDataset(
    manifest_or_path="data/manifests/meld_manifest.json",
    split="train"
)

# 2. Construct DataLoader
train_loader = DataLoader(
    train_dataset,
    batch_size=32,
    shuffle=True,
    num_workers=0,
    collate_fn=multimodal_collate_fn
)

# 3. Iterate through batches
for batch in train_loader:
    text_batch = batch["text"]            # torch.Size([32, 64])
    audio_batch = batch["audio"]          # torch.Size([32, 200, 13])
    vision_batch = batch["vision"]        # torch.Size([32, 1, 48, 48])
    labels = batch["label"]               # torch.Size([32])
    modality_masks = batch["modality_mask"] # torch.Size([32, 3])
```
