# Research Questions (RQs) — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 0 Foundation)  
**Status**: Formalized  

---

## Overview

The MindSense research project is guided by seven primary Research Questions (RQs). Each RQ defines a specific scientific inquiry, measurable variables, evaluation metrics, and the relevant experiment IDs registered in [docs/EXPERIMENT_REGISTRY.md](file:///docs/EXPERIMENT_REGISTRY.md).

---

## RQ1: Multimodal Synergy vs. Unimodal Baselines

> **Research Question 1**:  
> **Does multimodal fusion (Text + Audio + Vision) significantly improve emotion recognition accuracy and macro F1 score compared with individual unimodal baselines under standardized subject-independent splits?**

- **Independent Variable**: Modality availability (Text-only, Audio-only, Vision-only vs. Multimodal Fused).
- **Dependent Variables**: Top-1 Accuracy (%), Macro F1-Score (%), Class-wise Recall (%).
- **Target Condition**: Complete, uncorrupted input streams.
- **Related Experiments**: `E01`, `E02`, `E03`, `E04`, `E05`, `E06`.

---

## RQ2: Missing-Modality Robustness & Adaptive Weighting

> **Research Question 2**:  
> **Does adaptive modality weighting maintain higher classification performance and lower performance degradation compared to fixed early/late fusion when one or more modalities are missing at inference time?**

- **Independent Variable**: Missing modality subsets (Text missing, Audio missing, Vision missing, Dual modalities missing), fusion strategy (Fixed early concatenation, Late decision averaging, Intermediate attention, Adaptive reliability gating).
- **Dependent Variables**: Relative accuracy drop ($\Delta \text{Acc}$), Macro F1 across all $2^M - 1$ modality combinations.
- **Target Condition**: Systematic modality ablation ($M \in \{1, 2, 3\}$).
- **Related Experiments**: `E07`, `E08`, `E09`.

---

## RQ3: Uncertainty Estimation & Probability Calibration

> **Research Question 3**:  
> **Can explicit uncertainty estimation and confidence calibration techniques (e.g., temperature scaling, Monte Carlo dropout, Dirichlet calibration) improve prediction reliability and reduce Expected Calibration Error (ECE) under complete and degraded modality inputs?**

- **Independent Variable**: Calibration method (Uncalibrated Softmax vs. Temperature Scaling vs. Reliability-weighted scaling), input corruption level.
- **Dependent Variables**: Expected Calibration Error (ECE), Maximum Calibration Error (MCE), Brier Score, Negative Log-Likelihood (NLL).
- **Target Condition**: Evaluation across confidence bins and reliability diagrams.
- **Related Experiments**: `E12`.

---

## RQ4: Modality Conflict Resolution (Affective Dissonance)

> **Research Question 4**:  
> **How does the proposed multimodal system resolve predictions when input modalities present discordant or conflicting affective cues (e.g., positive lexical sentiment paired with angry acoustic prosody or distressed facial action units)?**

- **Independent Variable**: Degree of inter-modality conflict (Concordant vs. Artificially swapped / naturally discordant pairs).
- **Dependent Variables**: Modality dominance ratio, Entropy of output distribution, Classification accuracy against ground-truth intent.
- **Target Condition**: Controlled synthetic cross-swapped samples and natural sarcastic/discordant benchmarks.
- **Related Experiments**: `E11`.

---

## RQ5: Cross-Dataset Generalization

> **Research Question 5**:  
> **How well does an emotion recognition model trained on one standard benchmark (e.g., IEMOCAP) generalize to unseen external datasets (e.g., MELD, CMU-MOSEI) without fine-tuning, and what is the magnitude of the domain transfer gap?**

- **Independent Variable**: Source training dataset vs. Target evaluation dataset.
- **Dependent Variables**: Cross-domain Accuracy (%), Macro F1 (%), Domain Transfer Drop ($\Delta_{\text{transfer}}$).
- **Target Condition**: Zero-shot cross-corpus evaluation across distinct acoustic and visual recording domains.
- **Related Experiments**: `E13`.

---

## RQ6: Cross-User / Subject-Independent Generalization

> **Research Question 6**:  
> **What is the quantitative performance disparity between a speaker-dependent (randomly partitioned) model and a strictly speaker-independent (Leave-One-Subject-Out or disjoint subject split) model?**

- **Independent Variable**: Data partitioning protocol (Random sample-level split vs. Subject/person-isolated split).
- **Dependent Variables**: Generalization gap ($\Delta_{\text{subject}}$), Variance across unseen subjects ($\sigma^2_{\text{subject}}$).
- **Target Condition**: Rigorous validation against subject identity leakage.
- **Related Experiments**: `E14`.

---

## RQ7: Real-World In-the-Wild Performance

> **Research Question 7**:  
> **How does system performance shift when evaluated on naturalistic, unconstrained user-generated data compared with controlled laboratory benchmark datasets?**

- **Independent Variable**: Data provenance (Lab-recorded/acted corpora vs. Consented real-world in-the-wild longitudinal user submissions).
- **Dependent Variables**: Classification stability, Distribution shift metrics, Frequency of out-of-distribution (OOD) flags.
- **Target Condition**: Ethically collected and consented real-world user data.
- **Related Experiments**: `E16`.

---

## Summary Matrix

| RQ | Focus Area | Core Metric | Primary Experiment |
| :---: | :--- | :--- | :---: |
| **RQ1** | Multimodal Synergy | Accuracy, Macro F1 | `E01`–`E06` |
| **RQ2** | Missing Modalities | Degradation Slope ($\Delta \text{Acc}$) | `E07`–`E09` |
| **RQ3** | Calibration & Reliability | Expected Calibration Error (ECE), Brier | `E12` |
| **RQ4** | Modality Conflict | Dominance Ratio, Entropy | `E11` |
| **RQ5** | Cross-Dataset Transfer | Cross-Domain Macro F1 | `E13` |
| **RQ6** | Subject Generalization | Identity Leakage Gap ($\Delta_{\text{leak}}$) | `E14` |
| **RQ7** | Real-World Validation | Out-of-Distribution Shift | `E16` |
