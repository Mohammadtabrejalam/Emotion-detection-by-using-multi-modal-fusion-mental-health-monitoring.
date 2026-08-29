# Experiment Registry (E01–E16) — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 0 Formal Registry)  
**Status**: REGISTERED ONLY (Experiments to be executed in Phase 1+)  

---

## 1. Overview & Execution Policy

> [!IMPORTANT]
> **PHASE 0 RESEARCH NOTICE**:  
> All 16 experiments defined below are registered specifications.  
> **No experimental runs are executed in Phase 0**.  
> Execution will occur systematically in Phase 1+ adhering to the registered parameters below.

---

## 2. Granular Experiment Catalog

---

### E01 — Unimodal Text Baseline
* **Research Question**: RQ1 (Unimodal baseline characterization)
* **Independent Variable**: Text representation (RoBERTa / DeBERTa / Word2Vec embeddings)
* **Dependent Variables**: Accuracy, Macro F1, Class-wise Precision/Recall
* **Dataset**: IEMOCAP / MELD / CMU-MOSEI
* **Split**: Subject-Independent Train/Val/Test (5-fold cross-validation)
* **Model**: Unimodal Text Encoder + MLP Classification Head ($d=64/256$)
* **Baseline**: Majority class voting
* **Metrics**: Top-1 Accuracy, Macro F1, Cross-Entropy Loss
* **Expected Output**: Text provides strong semantic discrimination for discrete emotions (e.g. Happy, Sad) with moderate Macro F1 (~60–65%).

---

### E02 — Unimodal Audio Baseline
* **Research Question**: RQ1 (Unimodal acoustic baseline characterization)
* **Independent Variable**: Audio representation (MFCC vs. Wav2Vec 2.0 / HuBERT)
* **Dependent Variables**: Accuracy, Macro F1, Arousal-correlated class recall
* **Dataset**: IEMOCAP / MELD
* **Split**: Subject-Independent Train/Val/Test (5-fold cross-validation)
* **Model**: Unimodal Audio 1D-CNN / HuBERT + MLP Classification Head
* **Baseline**: Majority class voting
* **Metrics**: Top-1 Accuracy, Macro F1, Confusion Matrix
* **Expected Output**: Audio excels at high-arousal discrimination (Anger, Fear, Excitement) with lower performance on valence separation (~55–60% Macro F1).

---

### E03 — Unimodal Vision Baseline
* **Research Question**: RQ1 (Unimodal visual facial expression baseline)
* **Independent Variable**: Vision representation (2D-CNN vs. ResNet-18 vs. ViT face crops)
* **Dependent Variables**: Accuracy, Macro F1, Valence-correlated class recall
* **Dataset**: MELD (video face crops) / FER-2013 / AffectNet
* **Split**: Subject-Independent Train/Val/Test
* **Model**: Unimodal Vision 2D-CNN / ResNet + Classification Head
* **Baseline**: Majority class voting
* **Metrics**: Top-1 Accuracy, Macro F1
* **Expected Output**: Vision provides strong valence signals (Surprise, Happy, Disgust) but suffers under occlusions and head pose angles (~56–62% Macro F1).

---

### E04 — Early Fusion Baseline (Feature Concatenation)
* **Research Question**: RQ1 (Early feature fusion comparison)
* **Independent Variable**: Concatenated feature vectors $[e_t \mathbin{\Vert} e_a \mathbin{\Vert} e_v] \in \mathbb{R}^{3d}$
* **Dependent Variables**: Accuracy, Macro F1, Training convergence speed
* **Dataset**: IEMOCAP / MELD
* **Split**: Subject-Independent Train/Val/Test
* **Model**: Early Concatenation Layer + Multi-Layer Perceptron (MLP)
* **Baseline**: Strongest unimodal baseline ($\max(\text{E01}, \text{E02}, \text{E03})$)
* **Metrics**: Top-1 Accuracy, Macro F1, Training Loss
* **Expected Output**: Modest gain over unimodal baselines (+3–5%), but susceptible to feature dimension mismatch and total failure when any input is missing.

---

### E05 — Late Fusion Baseline (Decision-Level Probability Averaging)
* **Research Question**: RQ1 (Late decision fusion comparison)
* **Independent Variable**: Weighting scheme (Uniform $w_m = 1/3$ vs. Learned static weights vs. Softmax entropy weighting)
* **Dependent Variables**: Accuracy, Macro F1, Confidence Calibration (ECE)
* **Dataset**: IEMOCAP / MELD
* **Split**: Subject-Independent Train/Val/Test
* **Model**: Independent unimodal encoders + Weighted softmax probability summation
* **Baseline**: Strongest unimodal baseline ($\max(\text{E01}, \text{E02}, \text{E03})$)
* **Metrics**: Top-1 Accuracy, Macro F1, ECE
* **Expected Output**: Moderate gain over unimodal models (+4–6%), robust to missing modalities, but incapable of capturing intermediate cross-modal synergy.

---

### E06 — Intermediate Cross-Attention Fusion (Standard Transformer)
* **Research Question**: RQ1 (Transformer cross-attention synergy)
* **Independent Variable**: Attention mechanism (Multi-head self-attention with learned modality embeddings and `key_padding_mask`)
* **Dependent Variables**: Accuracy, Macro F1, Attention weight distributions
* **Dataset**: IEMOCAP / MELD / CMU-MOSEI
* **Split**: Subject-Independent Train/Val/Test
* **Model**: PyTorch Multimodal Intermediate Fusion Transformer (`d_model=64/256`, 4 heads)
* **Baseline**: Early Fusion (E04) and Late Fusion (E05)
* **Metrics**: Top-1 Accuracy, Macro F1, Weighted F1, Confusion Matrix
* **Expected Output**: Statistically significant improvement over E04 and E05 (+2–4% over Late Fusion on complete sets).

---

### E07 — Adaptive Fusion with Dynamic Reliability Weighting
* **Research Question**: RQ2 (Adaptive modality weighting)
* **Independent Variable**: Dynamic reliability estimator gating ($r_m \cdot e_m$) vs. static attention
* **Dependent Variables**: Accuracy, Macro F1, Reliability scores per modality ($r_t, r_a, r_v$)
* **Dataset**: IEMOCAP / MELD
* **Split**: Subject-Independent Train/Val/Test
* **Model**: Target Adaptive Fusion Network with learnable reliability estimators
* **Baseline**: Standard Attention Fusion (E06)
* **Metrics**: Accuracy, Macro F1, Learned reliability alignment with empirical accuracy
* **Expected Output**: Adaptive weighting matches or outperforms E06 on clean data and yields dynamic gating correlated with modality SNR.

---

### E08 — Single Missing-Modality Robustness
* **Research Question**: RQ2 (Missing modality degradation curves)
* **Independent Variable**: Missing modality condition ($\text{Text-missing: } A+V$, $\text{Audio-missing: } T+V$, $\text{Vision-missing: } T+A$)
* **Dependent Variables**: Performance retention ($\Delta \text{Acc} = \text{Acc}_{\text{missing}} / \text{Acc}_{\text{full}}$), Macro F1
* **Dataset**: IEMOCAP / MELD
* **Split**: Subject-Independent Train/Val/Test
* **Model**: Adaptive Fusion (E07) vs. Late Fusion (E05) vs. Zero-Imputed Early Fusion (E04)
* **Baseline**: Late Fusion (E05)
* **Metrics**: Accuracy drop ($\Delta \text{Acc}$), Macro F1 degradation slope
* **Expected Output**: Adaptive fusion maintains $>88\%$ of full performance on bi-modal subsets, significantly outperforming zero-imputed early fusion.

---

### E09 — Multiple Missing-Modality Robustness (Minimal Inputs)
* **Research Question**: RQ2 (Degradation under dual missing modalities)
* **Independent Variable**: Minimal input subset ($T$-only, $A$-only, $V$-only fed to full multimodal network)
* **Dependent Variables**: Accuracy compared to standalone unimodal models (E01, E02, E03)
* **Dataset**: IEMOCAP / MELD
* **Split**: Subject-Independent Train/Val/Test
* **Model**: Adaptive Multimodal Network (E07) evaluating single active tokens
* **Baseline**: Standalone Unimodal Networks (E01, E02, E03)
* **Metrics**: Accuracy, Macro F1, Cross-Entropy Loss
* **Expected Output**: Multimodal model evaluated on a single modality matches standalone unimodal baselines within $\pm 1.5\%$ margin, demonstrating absence of catastrophic modality collapse.

---

### E10 — Controlled Noise & Sensor Degradation Robustness
* **Research Question**: RQ2 (Noise degradation curves)
* **Independent Variable**: Acoustic SNR ($\text{SNR} \in \{20, 10, 0, -5\}\text{ dB}$) and Image Gaussian Blur ($\sigma \in \{1, 3, 5\}$)
* **Dependent Variables**: Accuracy retention, Modality reliability score shifts
* **Dataset**: IEMOCAP / MELD
* **Split**: Subject-Independent Train/Val/Test
* **Model**: Adaptive Fusion (E07) vs. Standard Attention (E06) vs. Late Fusion (E05)
* **Baseline**: Standard Attention (E06)
* **Metrics**: Accuracy vs. Noise Curves, Learned reliability $r_m$ vs. injected noise SNR
* **Expected Output**: Adaptive reliability head successfully identifies noisy streams and down-weights them, preserving overall classification accuracy.

---

### E11 — Modality Conflict & Affective Dissonance Resolution
* **Research Question**: RQ4 (Resolving conflicting affective signals)
* **Independent Variable**: Concordant pairs vs. Synthetic cross-swapped discordant pairs (e.g. Joyful text + Angry acoustic prosody)
* **Dependent Variables**: Prediction distribution entropy, Modality dominance ratio ($P(\text{Text}) \text{ vs. } P(\text{Audio})$)
* **Dataset**: IEMOCAP Discordant Subset / Sarcasm-annotated MELD clips
* **Split**: Subject-Independent Test Set
* **Model**: Adaptive Fusion (E07) vs. Late Fusion (E05) vs. Early Fusion (E04)
* **Baseline**: Late Fusion (E05)
* **Metrics**: Prediction Entropy ($H(Y|X)$), Dominance index, Ground-truth sarcastic intent accuracy
* **Expected Output**: Adaptive fusion identifies non-verbal leakage and resolves toward acoustic/visual affect in sarcastic scenarios, avoiding neutral collapse.

---

### E12 — Prediction Uncertainty & Calibration Benchmarking
* **Research Question**: RQ3 (Confidence calibration and reliability)
* **Independent Variable**: Calibration algorithm (Uncalibrated Softmax vs. Temperature Scaling vs. Focal Calibration Loss)
* **Dependent Variables**: Expected Calibration Error (ECE), Maximum Calibration Error (MCE), Brier Score, NLL
* **Dataset**: IEMOCAP / MELD / CMU-MOSEI
* **Split**: Subject-Independent Train/Val/Test
* **Model**: Calibrated Multimodal Network
* **Baseline**: Uncalibrated Softmax model
* **Metrics**: ECE (10 bins), Brier Score, Reliability Diagram visual alignment
* **Expected Output**: Temperature scaling and reliability weighting reduce ECE by $>40\%$ without altering rank accuracy.

---

### E13 — Cross-Dataset Generalization & Domain Transfer
* **Research Question**: RQ5 (Zero-shot external dataset transfer)
* **Independent Variable**: Source training domain (IEMOCAP) vs. Target evaluation domain (MELD, CMU-MOSEI)
* **Dependent Variables**: Out-of-domain Accuracy, Cross-domain Macro F1, Domain Transfer Penalty ($\Delta_{\text{domain}}$)
* **Dataset**: Source: IEMOCAP $\to$ Target: MELD / CMU-MOSEI
* **Split**: Full Target Corpus Evaluation (zero-shot transfer)
* **Model**: Source-trained Multimodal Model
* **Baseline**: In-domain MELD model (upper bound) vs. Random chance (lower bound)
* **Metrics**: Macro F1, Domain drop ($\Delta_{\text{transfer}}$)
* **Expected Output**: Empirical documentation of the domain transfer gap (expected drop of ~12–18% Macro F1 due to environmental and acoustic domain shift).

---

### E14 — Cross-Subject Generalization & Identity Leakage Audit
* **Research Question**: RQ6 (Quantifying subject identity leakage)
* **Independent Variable**: Splitting strategy (Random sample-level shuffle vs. Strict Subject/Speaker Disjoint Split)
* **Dependent Variables**: Apparent accuracy on random split vs. True generalization accuracy on subject-disjoint split
* **Dataset**: IEMOCAP (10 actors) / MELD (~47 actors)
* **Split**: Random Split vs. 5-Fold Subject-Disjoint Cross-Validation
* **Model**: Multimodal Intermediate Attention Model
* **Baseline**: Random sample-split model
* **Metrics**: $\Delta_{\text{leak}} = \text{Acc}_{\text{random}} - \text{Acc}_{\text{disjoint}}$, Subject-wise variance ($\sigma^2_{\text{subject}}$)
* **Expected Output**: Random split will overestimate accuracy by 10–18%, confirming the necessity of subject-independent protocols.

---

### E15 — Full Model Ablation Study
* **Research Question**: RQ1, RQ2, RQ3 (Systematic ablation of all components)
* **Independent Variable**: Systematic removal of: (a) Pretrained embeddings, (b) Reliability heads, (c) Modality positional encodings, (d) Dynamic token pooling, (e) Temperature scaling
* **Dependent Variables**: Accuracy, Macro F1, ECE, Inference latency (ms)
* **Dataset**: IEMOCAP / MELD
* **Split**: Subject-Independent Train/Val/Test
* **Model**: Full Target Model vs. Component-Ablated Variants
* **Baseline**: Full Target Architecture
* **Metrics**: $\Delta \text{Macro F1}$, $\Delta \text{ECE}$, Parameter count, Floating-point operations (FLOPs)
* **Expected Output**: Isolated quantification of the exact contribution of each architectural module.

---

### E16 — Real-World Longitudinal Validation
* **Research Question**: RQ7 (Naturalistic longitudinal deployment validation)
* **Independent Variable**: Data provenance (Lab-recorded benchmark samples vs. Consented naturalistic user check-ins)
* **Dependent Variables**: Prediction entropy, Out-of-distribution divergence score, User longitudinal mood agreement
* **Dataset**: Consented MindSense Research Participant Corpus
* **Split**: Longitudinal temporal holdout per participant
* **Model**: Calibrated Multimodal Production Model
* **Baseline**: Laboratory Benchmark Evaluation
* **Metrics**: Feature distribution shift (Wasserstein distance), Average prediction confidence, Longitudinal wellness score correlation
* **Expected Output**: Naturalistic data exhibits wider feature variance, validating the necessity of uncertainty-aware rejection thresholds.

---

## 3. Summary Experiment Matrix

| ID | Title | Primary Focus | Independent Variable | Key Metrics |
| :--- | :--- | :--- | :--- | :--- |
| **E01** | Text Baseline | Unimodal text | Text encoder ($d=64/256$) | Accuracy, Macro F1 |
| **E02** | Audio Baseline | Unimodal audio | MFCC vs. HuBERT | Accuracy, Macro F1 |
| **E03** | Vision Baseline | Unimodal vision | 2D-CNN vs. ResNet | Accuracy, Macro F1 |
| **E04** | Early Fusion | Concatenation | Flat vector $[e_t \Vert e_a \Vert e_v]$ | Accuracy, Macro F1 |
| **E05** | Late Fusion | Decision voting | Weighted Softmax sum | Accuracy, Macro F1 |
| **E06** | Attention Fusion | Cross-attention | Transformer Encoder | Accuracy, Macro F1 |
| **E07** | Adaptive Fusion | Dynamic weighting | Reliability gating $r_m$ | Accuracy, Macro F1 |
| **E08** | Single Missing | Missing inputs | Absent modality ($A+V, T+V, T+A$) | Retention $\Delta \text{Acc}$ |
| **E09** | Dual Missing | Minimal inputs | Single modality to fused net | Accuracy vs. Unimodal |
| **E10** | Noise Robustness | Degraded sensors | Acoustic SNR / Visual blur | Accuracy vs. Noise curve |
| **E11** | Conflict Resolution| Affective discord | Swapped modality valences | Prediction Entropy |
| **E12** | Calibration | Confidence scoring| Temperature scaling | ECE, Brier Score |
| **E13** | Cross-Dataset | Domain transfer | Source (IEMOCAP) $\to$ Target (MELD)| Transfer drop $\Delta_{\text{transfer}}$ |
| **E14** | Cross-User | Identity leakage | Random vs. Subject-disjoint | Leakage gap $\Delta_{\text{leak}}$ |
| **E15** | Ablation Study | Architectural parts| Component removal | $\Delta \text{F1}$, $\Delta \text{ECE}$ |
| **E16** | Real-World Study | In-the-wild shift | Lab corpus vs. Consented user | OOD divergence, Entropy |
