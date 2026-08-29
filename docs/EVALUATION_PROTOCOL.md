# Evaluation Protocol & Metrics Specification — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 0 Foundation)  
**Status**: Formalized Benchmark Protocol  

---

## 1. Subject-Independent Data Partitioning Policy

> [!CAUTION]
> **STRICT PROHIBITION OF SPEAKER / IDENTITY LEAKAGE**:  
> Under no circumstances may samples from the same person, speaker, or actor appear in both the training partition and the validation or test partitions.

Naive random sampling assigns utterances from the same speaker across training and testing splits. This causes models to memorize idiosyncratic vocal resonance, facial bone structures, and personal speech rhythms, inflating reported accuracy by up to 15–20% without genuine affective generalization.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 STRICT SUBJECT-INDEPENDENT PARTITIONING                     │
├──────────────────────────┬─────────────────────────┬────────────────────────┤
│ TRAIN PARTITION          │ VALIDATION PARTITION    │ TEST PARTITION         │
│ (e.g. Speakers 01–08)    │ (e.g. Speaker 09)       │ (e.g. Speaker 10)      │
│ ~70–80% of Subjects      │ ~10–15% of Subjects     │ ~10–15% of Subjects    │
│ Zero identity overlap    │ Zero identity overlap   │ Zero identity overlap  │
└──────────────────────────┴─────────────────────────┴────────────────────────┘
```

### Partitioning Rules:
1. **Speaker/Actor Disjointness**: Partitioning is executed strictly on unique subject IDs ($S_{\text{train}} \cap S_{\text{val}} = \emptyset$, $S_{\text{train}} \cap S_{\text{test}} = \emptyset$, $S_{\text{val}} \cap S_{\text{test}} = \emptyset$).
2. **Session / Dialogue Integrity**: Entire dyadic dialogues and conversational episodes must reside within a single partition to prevent temporal sequence leakage.
3. **Class Stratification**: Where possible, subject assignment must preserve balanced class label distributions across folds.
4. **K-Fold Cross-Validation**: For small-subject corpora (e.g., IEMOCAP with 10 speakers across 5 sessions), 5-fold Leave-One-Session-Out (LOSO) cross-validation is mandatory.

---

## 2. Reproducibility & Provenance Metadata

Every experimental evaluation run must record and freeze the following configuration tuple:
- **Global Seed**: Deterministic PRNG seed (default: `42`, repeated across `[42, 1337, 2026, 7, 999]`).
- **Dataset Version**: Fixed semantic versioning (e.g., `iemocap_v1.0_clean`, `meld_raw_v2.1`).
- **Preprocessing Version**: Git SHA of preprocessing transformation scripts.
- **Model Checkpoint Hash**: SHA-256 hash of saved `.pt` weights.
- **Experiment ID**: Standardized tracking code (e.g., `EXP-E01-TEXT-BASE-001`).
- **Hardware Profile**: CPU model, GPU architecture, CUDA/cuDNN version, PyTorch release.

---

## 3. Comprehensive Metrics Suite

System performance must be evaluated across four distinct measurement dimensions: Classification, Calibration, Robustness, and Generalization.

```
                               ┌────────────────────────────────┐
                               │   MINDSENSE EVALUATION SUITE   │
                               └───────────────┬────────────────┘
                 ┌────────────────────┬────────┴────────────┬────────────────────┐
                 ▼                    ▼                     ▼                    ▼
        ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────┐ ┌─────────────────┐
        │ Classification  │  │   Calibration   │  │    Robustness     │ │ Generalization  │
        │ - Accuracy      │  │ - ECE           │  │ - Missing Modals  │ │ - In-Domain     │
        │ - Macro F1      │  │ - MCE           │  │ - Audio Noise     │ │ - Cross-Dataset │
        │ - Weighted F1   │  │ - Brier Score   │  │ - Vision Blur     │ │ - Cross-Subject │
        │ - Class Recall  │  │ - Reliability   │  │ - ASR Corruption  │ │ - Cross-User    │
        │ - Conf. Matrix  │  │   Diagrams      │  │ - Modality Conflic│ │ - Real-World    │
        └─────────────────┘  └─────────────────┘  └───────────────────┘ └─────────────────┘
```

---

### 3.1 Classification Performance Metrics

Given $K$ emotion classes, ground truth $y$, and predictions $\hat{y}$:

1. **Top-1 Classification Accuracy**:
   $$\text{Accuracy} = \frac{1}{N} \sum_{i=1}^N \mathbf{1}(\hat{y}_i = y_i)$$
2. **Macro-Averaged Precision & Recall**:
   $$\text{Macro Precision} = \frac{1}{K} \sum_{k=1}^K \frac{\text{TP}_k}{\text{TP}_k + \text{FP}_k}, \quad \text{Macro Recall} = \frac{1}{K} \sum_{k=1}^K \frac{\text{TP}_k}{\text{TP}_k + \text{FN}_k}$$
3. **Macro-Averaged F1-Score (Primary Optimization Metric)**:
   $$\text{Macro F1} = \frac{1}{K} \sum_{k=1}^K \frac{2 \cdot \text{Precision}_k \cdot \text{Recall}_k}{\text{Precision}_k + \text{Recall}_k}$$
   *Macro F1 is prioritized over accuracy to avoid distortion caused by class imbalances (e.g. preponderance of "Neutral" utterances).*
4. **Weighted F1-Score**: F1 weighted by support per class.
5. **Multi-Class Confusion Matrix**: $K \times K$ normalized matrix documenting inter-class misclassification patterns.

---

### 3.2 Confidence Calibration & Uncertainty Metrics

1. **Expected Calibration Error (ECE)**:
   Partitions predictions into $M=10$ equal-width confidence bins $B_m \subset (0, 1]$:
   $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
   where $\text{acc}(B_m) = \frac{1}{|B_m|} \sum_{i \in B_m} \mathbf{1}(\hat{y}_i = y_i)$ and $\text{conf}(B_m) = \frac{1}{|B_m|} \sum_{i \in B_m} \hat{p}_i$.
2. **Maximum Calibration Error (MCE)**:
   $$\text{MCE} = \max_{m \in \{1,\dots,M\}} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
3. **Brier Score (Mean Squared Probability Error)**:
   $$\text{BS} = \frac{1}{N} \sum_{i=1}^N \sum_{k=1}^K (p_{ik} - y_{ik})^2$$
4. **Reliability Diagram**: Visual plot of sample confidence versus observed empirical accuracy per bin against the ideal diagonal identity line.

---

### 3.3 Robustness & Stress-Testing Regimes

Models are systematically stressed under controlled corruption regimes:

| Regime | Perturbation Description | Test Conditions |
| :--- | :--- | :--- |
| **Complete Modalities** | All $T, A, V$ available and clean | Baseline benchmark |
| **Single Missing Modality** | Text omitted ($A+V$), Audio omitted ($T+V$), Vision omitted ($T+A$) | Modality ablation curve |
| **Multiple Missing** | Text only ($T$), Audio only ($A$), Vision only ($V$) | Minimal input stability |
| **Acoustic Noise Stress** | Additive Gaussian white noise / Babble noise at varying SNR | $\text{SNR} \in \{20\text{dB}, 10\text{dB}, 0\text{dB}, -5\text{dB}\}$ |
| **Visual Degradation** | Gaussian blur, random face crop cutout, brightness reduction | Blur kernel $\sigma \in \{1, 3, 5\}$, Cutout $20\%$ |
| **Textual Corruption** | Simulated ASR word error rate (WER) via random char/word substitution | $\text{WER} \in \{10\%, 25\%, 50\%\}$ |
| **Conflicting Modalities** | Synthetic cross-swapping of discordant valence (e.g. Happy text + Angry audio) | Discordance resolution metric |

---

### 3.4 Generalization Regimes

1. **In-Domain (Subject-Independent)**: Standard test set within the same benchmark corpus across unseen subjects.
2. **Cross-Dataset (Zero-Shot Transfer)**: Model trained on Dataset A (e.g. IEMOCAP) evaluated directly on Dataset B (e.g. MELD) without fine-tuning.
3. **Cross-Subject Variance**: Standard deviation of Macro F1 across individual test subjects ($\sigma_{\text{subject}}$).
4. **Real-World Longitudinal Transfer**: Model evaluated on naturalistic user check-ins.

---

## 4. Phase 0 Protocol Status

This evaluation protocol is the binding methodological standard for all future experiments in the MindSense project.
