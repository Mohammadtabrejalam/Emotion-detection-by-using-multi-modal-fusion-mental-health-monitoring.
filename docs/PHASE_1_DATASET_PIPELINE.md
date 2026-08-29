# Real Dataset Pipeline Architecture — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 1 Pipeline Architecture)  
**Date**: August 2026  
**Status**: Formalized & Fully Implemented  

---

## 1. End-to-End Data Pipeline Architecture

MindSense Phase 1 replaces the prototype synthetic tensor generator with a verified, reproducible, and leakage-free real dataset ingestion pipeline.

```
                                  MELD RAW DATASET
                         (Dialogue Turns & Annotations)
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │ 1. Metadata Parsing         │
                         │    & Provenance Indexing    │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │ 2. Multimodal Alignment     │
                         │    (Text, Audio, Vision)    │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │ 3. Label Normalization      │
                         │    (Strict 7-Class Mapping) │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │ 4. Speaker-Independent      │
                         │    Partitioning (Zero-Leak) │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │ 5. Dataset Manifest         │
                         │    (JSON Schema Compliance) │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │ 6. Automated Integrity      │
                         │    & Leakage Validation     │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │ 7. PyTorch Dataset          │
                         │    (Explicit Modality Masks)│
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │ 8. DataLoader & Collate     │
                         │    (Batched Tensors)        │
                         └─────────────────────────────┘
```

---

## 2. Granular Step-by-Step Flow

### Step 1: Metadata Parsing & Provenance Indexing
- Raw dialogue turns are indexed by `dialogue_id` and `utterance_id`.
- Speaker character names (`Rachel`, `Monica`, `Chandler`, `Joey`, `Phoebe`, `Ross`, etc.) are assigned to `speaker_id`.

### Step 2: Multimodal Alignment
- Every sample binds the exact utterance transcript string, extracted 16 kHz audio track, and cropped video frames.
- Unrelated cross-sample combinations are strictly prohibited. Missing channels produce `modality_mask` values of `0.0`.

### Step 3: Label Normalization (`label_mapping.py`)
- Raw labels are normalized to the standard Ekman 6 + Neutral taxonomy: `happy` (0), `sad` (1), `angry` (2), `fear` (3), `surprise` (4), `disgust` (5), `neutral` (6).
- Ambiguous labels (e.g. IEMOCAP `frustration`) are rejected and marked for dedicated multi-label experiments.

### Step 4: Speaker-Independent Partitioning (`splits.py`)
- Greedy bin-packing partitions speakers into disjoint `train`, `val`, and `test` splits.
- Formally guarantees: $S_{\text{train}} \cap S_{\text{val}} = \emptyset$, $S_{\text{train}} \cap S_{\text{test}} = \emptyset$, $S_{\text{val}} \cap S_{\text{test}} = \emptyset$.

### Step 5: Dataset Manifest Serialization (`manifest.py`)
- Emits schema-compliant JSON manifest `data/manifests/meld_manifest.json` containing complete sample provenance.

### Step 6: Automated Validation Engine (`validation.py`)
- Verifies zero duplicate sample IDs, valid label assignments, complete modality metadata, and zero speaker cross-partition contamination.

### Step 7: PyTorch Dataset (`dataset.py`)
- `MultimodalEmotionDataset` dynamically extracts text tokens `(64,)`, audio MFCCs `(200, 13)`, and facial crops `(1, 48, 48)`.
- Emits 3D presence mask: `modality_mask = [has_text, has_audio, has_vision]`.

### Step 8: Batched DataLoader (`dataset.py`)
- `multimodal_collate_fn` packages variable inputs into batched tensors:
  - `"text"`: `(B, 64)` (`torch.int64`)
  - `"audio"`: `(B, 200, 13)` (`torch.float32`)
  - `"vision"`: `(B, 1, 48, 48)` (`torch.float32`)
  - `"label"`: `(B,)` (`torch.int64`)
  - `"modality_mask"`: `(B, 3)` (`torch.float32`)

---

## 3. Known Limitations & Edge Cases

1. **Class Distribution Skew**: Real conversational datasets have high proportions of `neutral` and `happy` utterances compared to `disgust` and `fear`. (Handled via class-weighted cross-entropy loss in training phases).
2. **Audio Background Noise**: Multi-party dialogue includes occasional ambient background noise and laugh tracks. (Provides naturalistic stress testing for acoustic robustness in Experiment `E10`).
3. **Face Occlusion**: Occasional rapid head turns or non-frontal angles. (Handled via Haar cascade fallback and zero-masked visual tokens).
