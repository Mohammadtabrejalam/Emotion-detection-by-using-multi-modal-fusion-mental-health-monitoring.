# Multimodal Alignment Protocol — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 1 Alignment Protocol)  
**Date**: August 2026  
**Status**: Formalized Protocol  

---

## 1. Core Principle of Multimodal Integrity

> [!CAUTION]
> **NO ARTIFICIAL CROSS-SAMPLE SYNTHESIS**:  
> Unrelated samples from different individuals, recording sessions, or datasets must **never** be stitched together simply because they share an emotion label.

Every multimodal training and evaluation sample must represent a single, contiguous behavioral event executed by the same speaker in the same conversational context.

---

## 2. Multimodal Alignment Unit

The atomic unit of multimodal alignment in MindSense is the **Conversational Utterance**:
- **Temporal Synchronization**: The audio stream, text transcript, and visual video frames share the exact temporal start ($t_{\text{start}}$) and end ($t_{\text{end}}$) window.
- **Hierarchical Context**:
  $$\text{Corpus} \longrightarrow \text{Session/Dialogue } D_i \longrightarrow \text{Utterance Turn } U_{ij} \longrightarrow (T_{ij}, A_{ij}, V_{ij}, y_{ij})$$
- In MELD, dialogue $i$ and utterance turn $j$ map uniquely to `dia{i}_utt{j}`.

---

## 3. Representation of Missing Modalities

When one or more modalities are unavailable (e.g. video camera off, audio muted, or ASR transcript missing):
1. **Modality Presence Vector**: A 3-dimensional binary indicator vector $\mathbf{m} \in \{0, 1\}^3$ is emitted:
   $$\mathbf{m} = [\mathbf{1}_{\text{text}}, \mathbf{1}_{\text{audio}}, \mathbf{1}_{\text{vision}}]$$
2. **No Fabricated Data**:
   - Missing text is represented as empty tokens (`[PAD]`) with $\mathbf{m}_0 = 0$.
   - Missing audio is represented as a zero tensor $\mathbf{0}^{200 \times 13}$ with $\mathbf{m}_1 = 0$.
   - Missing vision is represented as a zero tensor $\mathbf{0}^{1 \times 48 \times 48}$ with $\mathbf{m}_2 = 0$.
3. **Transformer Padding Mask**: In the cross-attention layer, the attention key padding mask is directly set to $\neg \mathbf{m}$ (where `True` masks out the token), ensuring the attention mechanism ignores missing modalities without introducing zero-biasing gradients.

---

## 4. Alignment Validation & Quality Rules

Before a sample is written to the manifest, it undergoes five automated alignment checks:

1. **Existence Verification**: Audio/video file references must point to existing, readable files on disk.
2. **Audio Decoding Check**: Audio file must decode into a valid non-empty NumPy array without NaN or infinite values.
3. **Duration Feasibility**: Utterance duration must be within plausible physical conversational bounds ($0.2\text{s} \le \text{duration} \le 30.0\text{s}$).
4. **Visual Frame Integrity**: Video/image must decode into valid pixel arrays. Face detection checks report whether faces were successfully identified.
5. **Text Length Feasibility**: Text must contain at least 1 non-whitespace character after cleaning.

---

## 5. Invalid Sample Handling

Samples failing validation are categorized and handled deterministically:
- **Corrupt File**: Logged as `corrupt_audio` or `corrupt_video` and excluded from training.
- **No Face Detected**: If video is valid but no face is found (e.g. shot of scenery), vision is marked as missing ($\mathbf{m}_2 = 0$, `quality_status="no_face"`) while preserving text and audio.
- **Empty Utterance**: Excluded from manifest.
