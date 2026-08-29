# Target Research Architecture Specification — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 0 Design Target)  
**Status**: DESIGN TARGET ONLY (Not to be implemented in Phase 0)  

---

## 1. Architectural Philosophy

> [!IMPORTANT]
> **PHASE 0 RESEARCH NOTICE**:  
> This specification documents the **future target architecture** for subsequent research phases.  
> It is **NOT** implemented in Phase 0. Phase 0 preserves the working prototype baseline.

The target research architecture is an **Uncertainty-Aware Adaptive Multimodal Fusion Network**. Its core design principles are:
1. **Hierarchical Unimodal Encoders**: Utilizing domain-pretrained foundation representations (e.g., RoBERTa/DeBERTa for text, Wav2Vec2/HuBERT for audio, ResNet/ViT for vision).
2. **Explicit Modality Reliability Estimation**: Estimating per-modality signal quality and confidence before fusion to prevent noisy modalities from corrupting joint representations.
3. **Dynamic Cross-Modal Self-Attention**: Projecting modality tokens into a shared latent space where attention weights are modulated by both semantic relevance and estimated reliability.
4. **Calibrated Uncertainty Estimation**: Providing well-calibrated class posterior distributions and explicit predictive uncertainty metrics (epistemic and aleatoric).

---

## 2. End-to-End Information Flow Diagram

```
TEXT INPUT (Tokens)               AUDIO INPUT (Waveform)              VISION INPUT (Frames)
        │                                   │                                   │
        ▼                                   ▼                                   ▼
┌───────────────────────┐         ┌───────────────────────┐           ┌───────────────────────┐
│ Pretrained Text       │         │ Pretrained Audio      │           │ Pretrained Vision     │
│ Encoder (e.g. RoBERTa)│         │ Encoder (e.g. HuBERT) │           │ Encoder (e.g. ViT)    │
└───────────┬───────────┘         └───────────┬───────────┘           └───────────┬───────────┘
            │                                 │                                   │
            ▼                                 ▼                                   ▼
┌───────────────────────┐         ┌───────────────────────┐           ┌───────────────────────┐
│ Text Embedding (e_t)  │         │ Audio Embedding (e_a) │           │ Vision Embedding (e_v)│
│  d_model = 256/512    │         │  d_model = 256/512    │           │  d_model = 256/512    │
└───────────┬───────────┘         └───────────┬───────────┘           └───────────┬───────────┘
            │                                 │                                   │
            ▼                                 ▼                                   ▼
┌───────────────────────┐         ┌───────────────────────┐           ┌───────────────────────┐
│ Text Reliability      │         │ Audio Reliability     │           │ Vision Reliability    │
│ Estimator (r_t ∈ [0,1])│        │ Estimator (r_a ∈ [0,1])│          │ Estimator (r_v ∈ [0,1])│
└───────────┬───────────┘         └───────────┬───────────┘           └───────────┬───────────┘
            │                                 │                                   │
            └───────────────────────┬─────────┴───────────────────────────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ Adaptive Modality Fusion    │
                     │  (Reliability-Weighted Gating│
                     │   + Modality Token Embeds)  │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ Cross-Modal Self-Attention  │
                     │  (Multi-Head Transformer)   │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ Dynamic Active Token Pool   │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ Emotion Classification Head │
                     │   (MLP -> Logits z ∈ R^K)   │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ Probability Distribution    │
                     │    p = Softmax(z)           │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ Uncertainty & Calibration   │
                     │  - Temperature Scaling      │
                     │  - Epistemic / Aleatoric    │
                     │  - ECE / Brier Scoring      │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ Final Output & Verification │
                     │ (Pred Class, Prob, Conf/ECE)│
                     └─────────────────────────────┘
```

---

## 3. Mathematical Formulation of Components

### 3.1 Unimodal Encoders & Projection
Given inputs $x_t$ (text), $x_a$ (audio), $x_v$ (vision):
$$e_t = \text{Linear}(\text{Encoder}_t(x_t)) \in \mathbb{R}^{d}$$
$$e_a = \text{Linear}(\text{Encoder}_a(x_a)) \in \mathbb{R}^{d}$$
$$e_v = \text{Linear}(\text{Encoder}_v(x_v)) \in \mathbb{R}^{d}$$

### 3.2 Modality Reliability Estimation
For each active modality $m \in \{t, a, v\}$, a lightweight subnetwork estimates an scalar reliability score $r_m \in (0, 1]$:
$$r_m = \sigma(W_{r, m} \cdot e_m + b_{r, m})$$
When a modality is missing, its indicator mask is set to $m_{\text{mask}} = 0$ and $r_m = 0$.

### 3.3 Reliability-Weighted Token Sequence
Each modality token is modulated by its reliability and augmented with a learned modality-type positional embedding $p_m \in \mathbb{R}^d$:
$$z_m = r_m \cdot e_m + p_m, \quad m \in \{t, a, v\}$$
The input sequence to the cross-attention layer is:
$$Z = [z_t, z_a, z_v] \in \mathbb{R}^{3 \times d}$$

### 3.4 Cross-Modal Multi-Head Attention
With key padding mask $M_{\text{pad}} \in \{0, 1\}^{3}$ (where $M_i = 1$ if modality is missing):
$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{Q K^T}{\sqrt{d_k}} + M_{\text{attn}}\right) V$$
$$\tilde{Z} = \text{TransformerEncoder}(Z, \text{key\_padding\_mask}=M_{\text{pad}})$$

### 3.5 Dynamic Active Pooling & Classification Head
$$h_{\text{fused}} = \frac{\sum_{m \in \text{active}} \tilde{z}_m}{\max(1, |\text{active}|)}$$
$$\text{Logits } z = W_2 \cdot \text{GELU}(W_1 h_{\text{fused}} + b_1) + b_2 \in \mathbb{R}^K$$

### 3.6 Calibration & Uncertainty Estimation
1. **Temperature Scaling**:
   $$\hat{p}_i = \frac{\exp(z_i / T)}{\sum_{j=1}^K \exp(z_j / T)}$$
   where $T > 0$ is learned on the validation split via NLL minimization.
2. **Predictive Entropy (Total Uncertainty)**:
   $$H(Y|X) = -\sum_{i=1}^K \hat{p}_i \log \hat{p}_i$$
3. **Epistemic Uncertainty via MC Dropout**:
   $$\text{Var}_{\text{epistemic}} = \frac{1}{T_{\text{mc}}} \sum_{t=1}^{T_{\text{mc}}} (\hat{p}_t - \bar{p})^2$$

---

## 4. Multi-Task Training Loss Formulation

The objective function combines classification loss with reliability regularization:
$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{CE}}(\hat{y}, y) + \lambda_1 \sum_{m \in \text{active}} \mathcal{L}_{\text{unimodal}}(\hat{y}_m, y) + \lambda_2 \mathcal{L}_{\text{cal}}(\hat{p}, y)$$
where:
- $\mathcal{L}_{\text{CE}}$ is cross-entropy on the fused multimodal logits.
- $\mathcal{L}_{\text{unimodal}}$ provides auxiliary gradient signals directly to unimodal encoders.
- $\mathcal{L}_{\text{cal}}$ is a focal calibration loss minimizing ECE.

---

## 5. Scope Statement

This target architecture represents the formal research design for Phase 1 onwards. No architectural modifications or weight rewrites are performed during Phase 0.
