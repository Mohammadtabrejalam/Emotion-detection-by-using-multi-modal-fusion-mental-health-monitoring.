# Research Gap Analysis — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 0 Foundation)  
**Status**: Formalized  

---

## 1. Introduction & Methodology

To maintain scientific integrity, this document systematically maps the affective computing and multimodal machine learning landscape. We distinguish **what is already established in peer-reviewed literature** from the **potential empirical contributions** of the MindSense research initiative.

We explicitly avoid exaggerated or fabricated novelty claims. Using standard Transformers or basic attention mechanisms is established practice in the literature; genuine research contributions emerge from rigorous empirical characterization, uncertainty calibration, and generalization testing under real-world sensor constraints.

---

## 2. Granular Research Gap Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               RESEARCH GAP MATRIX                                │
├───────────────────────────────┬──────────────────────────────────────────────────┤
│ Established in Literature     │ Potential Research Contribution                  │
├───────────────────────────────┼──────────────────────────────────────────────────┤
│ Standard multi-head attention │ Dynamic modality reliability estimation & gating │
│ Fixed concatenation / pooling │ Controlled missing-modality degradation curves   │
│ Cross-entropy loss training   │ Multi-class calibration (ECE / Brier scores)     │
│ In-corpus speaker-mixed splits│ Strict subject-independent cross-dataset testing │
└───────────────────────────────┴──────────────────────────────────────────────────┘
```

---

### Gap A: Missing-Modality Robustness

#### Established in Literature
- Zero-padding missing features or using static binary attention masking (`key_padding_mask` in PyTorch) is standard.
- Modality dropout during training improves general tolerance to absent inputs.

#### Unresolved Research Gap & Potential Contribution
- Many architectures suffer severe performance cliffs when primary informative modalities (e.g., text) are missing.
- **Potential Contribution**: Systematic empirical quantification of performance degradation across all $2^M - 1$ active combinations on benchmark datasets under identical training seeds and model capacity, benchmarking dynamic token pooling against zero-imputation.

---

### Gap B: Adaptive Modality Weighting

#### Established in Literature
- Tensor fusion networks, gated multimodal units (GMU), and cross-modal Transformers dynamically compute attention weights across tokens.

#### Unresolved Research Gap & Potential Contribution
- Standard self-attention attends to tokens based on feature similarity without explicitly scoring whether a specific sensor stream is degraded or corrupted.
- **Potential Contribution**: Investigating lightweight modality reliability estimators that dynamically down-weight degraded modalities before intermediate fusion, preventing corrupted modalities from contaminating uncorrupted representations.

---

### Gap C: Modality Reliability Estimation

#### Established in Literature
- Signal quality metrics (e.g., audio SNR, face detection confidence score) are often computed independently in preprocessing pipelines.

#### Unresolved Research Gap & Potential Contribution
- Extracted features in latent space rarely carry explicit uncertainty bounds into the fusion layer.
- **Potential Contribution**: Designing end-to-end learnable reliability heads that estimate variance or confidence bounds directly from unimodal representations.

---

### Gap D: Prediction Uncertainty & Calibration

#### Established in Literature
- Post-hoc temperature scaling and Platt scaling are well-established for unimodal image/text classification.
- Deep ensembles and Monte Carlo Dropout estimate epistemic uncertainty in computer vision.

#### Unresolved Research Gap & Potential Contribution
- Multimodal emotion classifiers are rarely evaluated for calibration error (Expected Calibration Error, Brier Score) under missing or noisy modality conditions.
- **Potential Contribution**: Comprehensive benchmarking of calibration metrics across complete vs. corrupted modality regimes, establishing whether multimodal fusion intrinsically improves or degrades prediction calibration.

---

### Gap E: Conflicting Modalities (Affective Dissonance)

#### Established in Literature
- Psychological literature demonstrates that non-verbal cues (prosody, facial action units) often leak true affect when verbal content is masked (sarcasm, social politeness).
- Sentiment analysis datasets (e.g., MUSD, Sarcasm corpora) evaluate lexical vs. acoustic dissonance.

#### Unresolved Research Gap & Potential Contribution
- Fusion models frequently default to majority voting or neutral collapse when modalities present contradictory valence (e.g., positive text with angry prosody).
- **Potential Contribution**: Constructing controlled synthetic and natural conflict test sets to benchmark how fusion architectures resolve affective discordance.

---

### Gap F: Cross-Dataset Generalization

#### Established in Literature
- Cross-corpus emotion recognition (CCER) is known to suffer significant domain shift drops due to annotation scheme differences and recording conditions.

#### Unresolved Research Gap & Potential Contribution
- Reported papers often train and test within a single dataset (e.g., IEMOCAP only), obscuring extreme domain overfit.
- **Potential Contribution**: Cross-dataset evaluation protocols (e.g., Train on IEMOCAP $\to$ Test on MELD and CMU-MOSEI) to empirically measure and report the exact generalization penalty.

---

### Gap G: Cross-User / Cross-Subject Generalization

#### Established in Literature
- Naive random train/test splits cause identity leakage, inflating accuracy by up to 15–20% because models memorize speaker acoustic/facial signatures.
- Leave-One-Speaker-Out (LOSO) cross-validation is the gold standard for speech emotion corpora.

#### Unresolved Research Gap & Potential Contribution
- Many published prototypes still report results using random splits.
- **Potential Contribution**: Enforcing strict, zero-leakage subject-independent partitioning across all benchmarks and quantifying the gap between speaker-dependent and speaker-independent performance.

---

### Gap H: Real-World Longitudinal Validation

#### Established in Literature
- In-the-wild video affect recognition (e.g., Aff-Wild, EmotiW) demonstrates high variability in unconstrained environments.

#### Unresolved Research Gap & Potential Contribution
- Lab-collected datasets with acted emotions fail to reflect naturalistic, longitudinal day-to-day user wellness reflections.
- **Potential Contribution**: Controlled real-world user study protocol (with full ethical consent and privacy protection) comparing lab benchmark performance against naturalistic user submissions.

---

## 3. Summary of Research Scope Boundaries

To prevent scope creep and maintain scientific validity:
1. MindSense does NOT seek to solve all affective computing challenges simultaneously.
2. The core focus is **robustness to missing/noisy modalities, prediction calibration, and subject-independent evaluation**.
3. All claims of advancement must be validated against standardized baselines using the registered experiments in [docs/EXPERIMENT_REGISTRY.md](file:///docs/EXPERIMENT_REGISTRY.md).
