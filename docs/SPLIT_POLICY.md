# Speaker-Independent Partitioning Policy — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 1 Split Standard)  
**Date**: August 2026  
**Status**: Formalized Protocol  

---

## 1. Objective & Methodological Mandate

The primary vulnerability in affective computing evaluation is **speaker identity leakage**. When utterances from the same person appear in both training and evaluation subsets, machine learning models memorize individual vocal formant characteristics, facial bone geometries, and idiosyncratic speech patterns rather than learning generic affective representations.

MindSense enforces a **strict subject-isolated partitioning policy**:
$$S_{\text{train}} \cap S_{\text{val}} = \emptyset, \quad S_{\text{train}} \cap S_{\text{test}} = \emptyset, \quad S_{\text{val}} \cap S_{\text{test}} = \emptyset$$

---

## 2. Partitioning Parameters & Seed Policy

- **Target Proportions**:
  - **Train Partition**: ~70% of total samples / speakers.
  - **Validation (Dev) Partition**: ~15% of total samples / speakers.
  - **Test Partition**: ~15% of total samples / speakers.
- **Deterministic PRNG Seed**:
  - Primary Benchmark Seed: `seed = 42`.
  - Multi-Seed Validation Suite: `seeds = [42, 1337, 2026, 7, 999]`.
- **Greedy Bin-Packing Algorithm**:
  Speakers are sorted by sample count in descending order and assigned to partitions using greedy bin-packing to match target sample distributions while preserving disjoint speaker sets.

---

## 3. Dataset-Specific Partitioning Schemes

### 3.1 MELD (Primary Dataset)
- **Speaker Grouping**: Utterances are grouped by speaker identifier (e.g. `Rachel`, `Monica`, `Chandler`, `Joey`, `Phoebe`, `Ross`, plus guest actors).
- **Dialogue Isolation**: In conversational dyadic/multi-party scenarios, entire dialogues are assigned to a single split, ensuring no turn within a scene is leaked into an evaluation partition.
- **Fixed Protagonist Splits (Alternative Protocol)**:
  - Train: 4 Core Protagonists + ~30 Guest Speakers.
  - Validation: 1 Core Protagonist + ~8 Guest Speakers.
  - Test: 1 Core Protagonist + ~9 Guest Speakers.

### 3.2 IEMOCAP (Secondary Benchmark)
- **5-Fold Leave-One-Session-Out (LOSO)**:
  - 10 distinct actors across 5 sessions (`Session1` through `Session5`).
  - Fold $k$: Train on 4 sessions (8 actors), Validate on 1 session (2 actors), Test on 1 held-out session.

---

## 4. Automated Leakage Verification Rules

The validation routine `validate_split_isolation()` in `backend/app/ml/data/splits.py` verifies the following assertions before every training run:

1. **Zero Speaker Overlap**: `assert train_speakers.isdisjoint(test_speakers)`
2. **Zero Sample Overlap**: `assert train_samples.isdisjoint(test_samples)`
3. **Session Consistency**: No single continuous conversation is split across partitions.
4. **Valid Split Names**: Only `"train"`, `"val"`, and `"test"` are accepted.
