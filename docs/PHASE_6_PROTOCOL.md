# Phase 6 — Cross-Dataset Generalization Protocol

## 1. Objective

Phase 6 evaluates whether the multimodal emotion recognition model trained on MELD generalizes to an independent external dataset.

The primary external dataset is IEMOCAP.

The first experiment is a zero-shot cross-dataset evaluation:

MELD → IEMOCAP

The model is trained using MELD and evaluated on eligible IEMOCAP samples without training or fine-tuning on IEMOCAP.

---

## 2. Primary Research Question

How well does the MELD-trained multimodal emotion recognition model generalize to an independently collected multimodal emotion dataset?

The experiment measures performance degradation caused by differences in:

- speakers
- recording conditions
- conversational context
- dataset composition
- annotation practices
- linguistic distribution
- audiovisual characteristics

---

## 3. Source Dataset

### Training Dataset

MELD.

Existing MELD training, validation, and test procedures from Phases 1–5 remain unchanged.

The Phase 3 multimodal fusion model is used as the primary model for this experiment.

### External Dataset

IEMOCAP.

IEMOCAP contains multimodal conversational emotion data including:

- speech
- video
- transcripts
- categorical emotion annotations

---

## 4. Evaluation Model

The Phase 3 MELD multimodal fusion model is used.

The model remains frozen during the zero-shot experiment.

No IEMOCAP samples are used for:

- model training
- fine-tuning
- checkpoint selection
- hyperparameter tuning
- temperature fitting
- threshold selection

The purpose is to measure genuine cross-dataset generalization.

---

## 5. Common Label Space

MELD uses seven emotion classes:

1. anger
2. disgust
3. fear
4. joy
5. neutral
6. surprise
7. sadness

IEMOCAP contains additional/different categorical labels.

For the first experiment, the common evaluation space is:

| MELD class | IEMOCAP mapping |
|---|---|
| anger | anger |
| disgust | disgust |
| fear | fear |
| joy | happiness + excitement |
| neutral | neutral |
| surprise | surprise |
| sadness | sadness |

IEMOCAP `frustration` and `other` are excluded rather than arbitrarily mapped to another MELD class.

The mapping must be implemented explicitly in the IEMOCAP adapter and recorded in the experiment configuration.

---

## 6. Zero-Shot Evaluation Protocol

The evaluation pipeline is:

IEMOCAP raw data
→ dataset adapter
→ transcript preprocessing
→ audio preprocessing
→ vision preprocessing
→ Phase 2 modality encoders
→ Phase 3 fusion model
→ seven-class prediction
→ evaluation metrics

No model parameters are updated during evaluation.

---

## 7. Modality Requirements

Each eligible IEMOCAP sample should be evaluated according to available modalities.

The preprocessing pipeline must remain compatible with the existing Phase 2 encoders.

### Text

Use the existing text preprocessing/tokenization interface wherever technically compatible.

Do not introduce a different text representation solely to improve IEMOCAP performance.

### Audio

Use the existing Phase 2 audio preprocessing and feature representation.

The resulting tensor must match the expected audio encoder input format.

### Vision

Use the existing Phase 2 vision preprocessing and representation.

The resulting tensor must match the expected vision encoder input format.

### Missing Modalities

Missing modalities must be represented explicitly using the same modality-mask mechanism established in Phase 3/4.

Missing data must not be silently interpreted as valid zero-valued observations.

---

## 8. Speaker and Data Leakage Prevention

IEMOCAP speakers must remain completely independent of MELD speakers.

No IEMOCAP information may be used during MELD model training or model selection.

No IEMOCAP labels may influence:

- model architecture
- training hyperparameters
- checkpoint selection
- calibration
- classification thresholds

---

## 9. Metrics

The zero-shot evaluation must report:

### Overall

- Accuracy
- Macro-F1
- Weighted-F1
- Macro Precision
- Macro Recall

### Per Class

For every common emotion:

- Precision
- Recall
- F1
- Support

### Confusion Matrix

A seven-class confusion matrix must be generated.

---

## 10. Comparison

The IEMOCAP results must be compared against the existing MELD in-domain test performance.

The comparison must clearly distinguish:

- MELD in-domain performance
- IEMOCAP zero-shot performance

The difference in performance is treated as evidence of cross-dataset domain shift rather than automatically interpreted as model failure.

---

## 11. Domain-Shift Analysis

The experiment should analyze possible sources of performance degradation, including:

- class distribution differences
- vocabulary differences
- speaker differences
- recording conditions
- conversational structure
- annotation differences
- modality availability
- emotion-category definitions

The analysis must distinguish measured evidence from hypotheses.

---

## 12. Reproducibility

All experiments must record:

- random seed
- model checkpoint
- dataset version/source
- label mapping
- preprocessing configuration
- modality configuration
- evaluation configuration
- software/environment information

The zero-shot evaluation must be deterministic wherever possible.

---

## 13. Artifacts

Phase 6 artifacts will be stored under:

artifacts/generalization/

Expected artifacts include:

- configuration
- evaluation metrics
- per-class metrics
- confusion matrix
- prediction results
- domain-shift statistics
- experiment summary

Large model/data files must not be committed to GitHub.

---

## 14. Tests

The implementation must include tests for:

1. IEMOCAP label mapping.
2. Exclusion of unsupported labels.
3. Dataset record parsing.
4. Text preprocessing.
5. Audio preprocessing.
6. Vision preprocessing.
7. Modality-mask generation.
8. Tensor shapes.
9. Deterministic evaluation.
10. Zero-shot model loading.
11. Metric calculation.

Existing Phase 1–5 tests must continue to pass.

---

## 15. Phase 6 Completion Criteria

Phase 6 is complete only when:

- IEMOCAP is obtained from an authorized source.
- The dataset is parsed successfully.
- The label mapping is explicitly implemented and documented.
- Unsupported labels are excluded correctly.
- All three modalities are processed correctly where available.
- The Phase 3 MELD model is evaluated without IEMOCAP training or fine-tuning.
- Zero-shot IEMOCAP results are generated.
- Overall and per-class metrics are saved.
- A confusion matrix is generated.
- MELD and IEMOCAP performance are compared.
- Domain-shift analysis is documented.
- Tests pass.
- Reproducibility information is recorded.
- A Phase 6 completion report is created.

---

## 16. Experiments

### E06-01 — MELD → IEMOCAP Zero-Shot

Training:

MELD

Evaluation:

IEMOCAP

Model:

Phase 3 multimodal fusion checkpoint

IEMOCAP training:

None

IEMOCAP fine-tuning:

None

Primary metrics:

Accuracy, Macro-F1, Weighted-F1

Secondary metrics:

Precision, Recall, per-class F1, confusion matrix

Purpose:

Measure cross-dataset generalization of the MELD-trained multimodal model.