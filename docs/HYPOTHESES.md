# Formal Scientific Hypotheses — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 0 Foundation)  
**Status**: Formalized (To be empirically tested in Phase 1+)  

---

## 1. Scientific Method & Hypothesis Testing Protocol

Each hypothesis below represents a testable, falsifiable empirical proposition. **None of these hypotheses are assumed to be true a priori**. Each hypothesis includes:
1. **Formal Research Statement** ($H_1$).
2. **Null Hypothesis** ($H_0$).
3. **Statistical Testing Protocol & Significance Level** ($\alpha = 0.05$).
4. **Primary Validation Experiments**.

---

## 2. Granular Hypotheses

### Hypothesis 1: Multimodal Synergy
> **$H_1$**: Intermediate attention-based multimodal fusion will achieve statistically significant higher classification accuracy and Macro F1 compared to the strongest individual unimodal baseline (Text, Audio, or Vision) when evaluated on complete input samples under subject-independent splits.

- **Null Hypothesis ($H_0$)**: $\text{Macro F1}_{\text{multimodal}} \le \max(\text{Macro F1}_{\text{text}}, \text{Macro F1}_{\text{audio}}, \text{Macro F1}_{\text{vision}})$.
- **Alternative ($H_A$)**: $\text{Macro F1}_{\text{multimodal}} > \max(\text{Macro F1}_{\text{text}}, \text{Macro F1}_{\text{audio}}, \text{Macro F1}_{\text{vision}})$.
- **Statistical Test**: Paired two-tailed Student's $t$-test or Wilcoxon signed-rank test across 5-fold subject-independent cross-validation runs ($\alpha = 0.05$).
- **Experiments**: `E01`, `E02`, `E03`, `E04`, `E05`, `E06`.

---

### Hypothesis 2: Missing-Modality Robustness of Adaptive Fusion
> **$H_2$**: An adaptive fusion architecture with dynamic modality reliability weighting will exhibit significantly lower relative accuracy degradation ($\Delta \text{Acc}$) than fixed concatenation (early fusion) or uniform decision averaging (late fusion) when one or more modalities are absent at test time.

- **Null Hypothesis ($H_0$)**: $\Delta \text{Acc}_{\text{adaptive}} \ge \Delta \text{Acc}_{\text{fixed}}$ across missing modality test subsets.
- **Alternative ($H_A$)**: $\Delta \text{Acc}_{\text{adaptive}} < \Delta \text{Acc}_{\text{fixed}}$.
- **Statistical Test**: Repeated measures ANOVA across missing modality permutations with post-hoc Tukey HSD test ($\alpha = 0.05$).
- **Experiments**: `E07`, `E08`, `E09`.

---

### Hypothesis 3: Calibration & Uncertainty Reduction
> **$H_3$**: Incorporating explicit reliability estimation and temperature calibration into the multimodal classifier will significantly reduce Expected Calibration Error (ECE) and Brier Score without degrading top-1 classification accuracy.

- **Null Hypothesis ($H_0$)**: $\text{ECE}_{\text{calibrated}} \ge \text{ECE}_{\text{uncalibrated}}$.
- **Alternative ($H_A$)**: $\text{ECE}_{\text{calibrated}} < \text{ECE}_{\text{uncalibrated}}$ with $\text{Accuracy}_{\text{calibrated}} \approx \text{Accuracy}_{\text{uncalibrated}}$ ($p > 0.05$ difference in accuracy).
- **Statistical Test**: Two-sample bootstrap test (10,000 resamples) on ECE and Brier score confidence intervals ($\alpha = 0.05$).
- **Experiments**: `E12`.

---

### Hypothesis 4: Affective Dissonance & Conflict Resolution
> **$H_4$**: When presented with contradictory affective signals across modalities, an adaptive attention model with learned reliability gating will maintain higher prediction stability and lower entropy collapse compared to static early or late fusion.

- **Null Hypothesis ($H_0$)**: $\text{Accuracy}_{\text{adaptive}} \le \text{Accuracy}_{\text{late}}$ on discordant/conflicting test subsets.
- **Alternative ($H_A$)**: $\text{Accuracy}_{\text{adaptive}} > \text{Accuracy}_{\text{late}}$ on discordant/conflicting test subsets.
- **Statistical Test**: McNemar's test for paired nominal classification outputs on discordant benchmark items ($\alpha = 0.05$).
- **Experiments**: `E11`.

---

### Hypothesis 5: Cross-Dataset Generalization Penalty
> **$H_5$**: Out-of-domain cross-dataset evaluation (e.g., train on IEMOCAP, test on MELD) will result in a statistically significant performance drop ($\Delta_{\text{domain}} > 10\%$ Macro F1) compared to in-domain subject-independent test performance.

- **Null Hypothesis ($H_0$)**: $\text{Macro F1}_{\text{in-domain}} - \text{Macro F1}_{\text{cross-dataset}} \le \epsilon$ (where $\epsilon$ is within noise margin).
- **Alternative ($H_A$)**: $\text{Macro F1}_{\text{in-domain}} - \text{Macro F1}_{\text{cross-dataset}} > 0.10$ ($p < 0.01$).
- **Statistical Test**: Two-sample $t$-test comparing in-domain vs. cross-domain test fold distributions.
- **Experiments**: `E13`.

---

### Hypothesis 6: In-the-Wild Real-World Distribution Shift
> **$H_6$**: Longitudinal naturalistic user-generated multimodal submissions will exhibit higher feature variance and lower model confidence than curated, acted laboratory corpora, exposing systematic domain shifts not visible in benchmark datasets.

- **Null Hypothesis ($H_0$)**: Prediction entropy and out-of-distribution (OOD) divergence on user data do not differ significantly from benchmark test sets.
- **Alternative ($H_A$)**: User-generated data exhibits significantly higher prediction entropy ($H(Y|X)$) and lower average confidence ($p < 0.001$).
- **Statistical Test**: Kolmogorov-Smirnov test and Mann-Whitney $U$ test on prediction entropy distributions.
- **Experiments**: `E16`.

---

## 3. Summary Hypothesis Testing Matrix

| Hypothesis | Proposed Effect | Statistical Metric | Decision Rule |
| :--- | :--- | :--- | :--- |
| **H1 (Synergy)** | Multimodal > Unimodal | Paired $t$-test on Macro F1 | Reject $H_0$ if $p < 0.05$ |
| **H2 (Missing Modality)** | Adaptive drop < Fixed drop | ANOVA on $\Delta \text{Acc}$ | Reject $H_0$ if $p < 0.05$ |
| **H3 (Calibration)** | ECE reduction | Bootstrap CI on ECE | Reject $H_0$ if Upper CI < Baseline |
| **H4 (Conflict)** | Adaptive > Static on conflict | McNemar's test | Reject $H_0$ if $p < 0.05$ |
| **H5 (Cross-Dataset)** | In-domain > Cross-domain | Two-sample $t$-test | Reject $H_0$ if $\Delta > 10\%$, $p < 0.01$ |
| **H6 (Real-World)** | High entropy on user data | Mann-Whitney $U$ test | Reject $H_0$ if $p < 0.001$ |
