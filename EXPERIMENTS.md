# Experiments & Benchmarks — MindSense

> [!WARNING]
> **RESEARCH STATUS: PROVISIONAL / NON-SCIENTIFIC / SYNTHETIC**  
> The metrics and ablation values detailed below represent **preliminary development baseline simulations** used for software pipeline verification during the initial prototype phase.  
> **Experimental results pending real-dataset evaluation.**  
> These numbers must NOT be cited or presented as peer-reviewed scientific findings until formal evaluation on benchmark datasets (IEMOCAP, MELD, CMU-MOSEI) is conducted in subsequent research phases.

---

## 1. Baseline Configurations (Conceptual & Prototype Models)

We define three fusion paradigms for comparative evaluation against our proposed attention-based architecture:

### Baseline 1: Unimodal Encoders
* **Configurations**: Text-only, Audio-only, Image-only.
* **Methodology**: Encoders operate independently. Predictions are derived by mapping the projected unimodal embedding ($d=64$) directly to a unimodal classification head.

### Baseline 2: Late Fusion
* **Methodology**: The unimodal encoders generate independent probability distributions ($P_{\text{text}}, P_{\text{audio}}, P_{\text{image}}$). The final prediction is a weighted average:
  $$P_{\text{final}} = w_t P_{\text{text}} + w_a P_{\text{audio}} + w_v P_{\text{image}}$$
  Where weights are uniformly distributed ($w_i = \frac{1}{\sum \mathbf{1}_{\text{active}}}$) or confidence-weighted based on entropy metrics.

### Baseline 3: Early Fusion (Concatenation)
* **Methodology**: Raw features or unimodal embeddings are concatenated into a single flat vector:
  $$X_{\text{concat}} = [T_{\text{emb}} \mathbin{\Vert} A_{\text{emb}} \mathbin{\Vert} V_{\text{emb}}] \in \mathbb{R}^{192}$$
  and fed directly into a multi-layer perceptron (MLP) classification network.

### Prototype Architecture: Intermediate Attention-based Fusion (Self-Attention)
* **Methodology**: Embeddings are treated as a sequence of modality tokens. They undergo cross-modal self-attention using PyTorch Transformer Encoder blocks. Missing modalities are masked via padding matrices.

---

## 2. Provisional Prototype Ablation Metrics (Simulated Baseline)

> [!NOTE]
> The figures below are prototype simulation metrics demonstrating UI and data flow. Real empirical benchmarking across standard datasets will be executed starting in Phase 1 following the protocols in [docs/EVALUATION_PROTOCOL.md](file:///docs/EVALUATION_PROTOCOL.md).

| Configuration | Fusion Type | Status | Provisional Accuracy (%) | Provisional F1-Score (%) |
| :--- | :--- | :--- | :---: | :---: |
| Text only | Unimodal | Prototype Baseline | 61.2% | 59.5% |
| Audio only | Unimodal | Prototype Baseline | 54.5% | 52.1% |
| Image only | Unimodal | Prototype Baseline | 58.0% | 56.4% |
| Text + Audio | Late Fusion | Prototype Baseline | 65.1% | 63.8% |
| Text + Image | Late Fusion | Prototype Baseline | 68.9% | 67.2% |
| Text + Audio | Concatenation | Prototype Baseline | 66.8% | 65.2% |
| Text + Image | Concatenation | Prototype Baseline | 70.2% | 68.5% |
| **Text + Audio (Prototype)** | **Attention Fusion** | Prototype Baseline | **68.4%** | **66.8%** |
| **Text + Image (Prototype)** | **Attention Fusion** | Prototype Baseline | **72.1%** | **70.3%** |
| **Text + Audio + Image (Prototype)** | **Attention Fusion** | Prototype Baseline | **79.5%** | **77.8%** |

---

## 3. Scientific Next Steps

1. Execute **Phase 1 Benchmark Integrations** on verified publicly available corpora (IEMOCAP, MELD, CMU-MOSEI).
2. Enforce strict **subject-independent splitting** to eliminate actor/speaker identity leakage.
3. Compute validated classification and calibration metrics (Expected Calibration Error, Brier Score) as cataloged in [docs/EXPERIMENT_REGISTRY.md](file:///docs/EXPERIMENT_REGISTRY.md).
