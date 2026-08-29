# System Architecture — MindSense

MindSense is a multimodal emotional-state evaluation platform that integrates text, speech acoustics, and facial expression features using an **intermediate feature-level fusion transformer**.

---

## 1. Modular Processing Pipeline

The architecture is split into decoupled layers:

```
[Written Text]  ------>  Preprocess (RegEx Tokenizer) ------->  TextEncoder (Embedding + Conv1D)
                                                                           |
[Acoustic Audio] ------> Preprocess (scipy 13 MFCC)   ------->  AudioEncoder (Conv1D Stack) ---> [Cross-Attention Fusion] ---> Classification MLP ---> Predict
                                                                           |
[Facial Photo]  ------>  Preprocess (OpenCV Haar Crop) ------->  VisionEncoder (2D CNN)
```

---

## 2. Unimodal Encoders

Each input modality is processed by a specific PyTorch encoder:

### A. Text Encoder
* **Input**: Sequence of 64 word tokens, mapped to a vocabulary size of 1000.
* **Architecture**: Word Embedding (dim=64) $\rightarrow$ 1D CNN Stack (kernel=3, padding=1) $\rightarrow$ Global Max Pooling $\rightarrow$ Dense Feature Projection.
* **Output Vector**: $T_{emb} \in \mathbb{R}^{64}$.

### B. Audio Encoder
* **Input**: Acoustic spectrogram represented as 200 frames of 13 Mel-Frequency Cepstral Coefficients (MFCCs).
* **Architecture**: Stack of three 1D CNN layers with Batch Normalization and Max-Pooling $\rightarrow$ Global Average Pooling $\rightarrow$ Dense Feature Projection.
* **Output Vector**: $A_{emb} \in \mathbb{R}^{64}$.

### C. Vision Encoder
* **Input**: Grayscale face-cropped image of size $48 \times 48 \times 1$.
* **Architecture**: Stack of three 2D CNN layers with Batch Normalization and Max-Pooling $\rightarrow$ Global Average Pooling $\rightarrow$ Dense Feature Projection.
* **Output Vector**: $V_{emb} \in \mathbb{R}^{64}$.

---

## 3. Intermediate Attention-based Fusion

Instead of simple late concatenation (which cannot model correlations between features at encoding time), MindSense projects all embeddings to a unified $64$-dimensional space and processes them as a sequence.

### A. Modality Tokens and Embeddings
We represent the input sequence as:
$$X = [T_{token}, A_{token}, V_{token}]$$

We add a learnable positional/modality embedding parameter $E_{mod} \in \mathbb{R}^{3 \times 64}$ to maintain input identification:
$$H_0 = X + E_{mod}$$

### B. Attention Masking for Missing Modalities
When a user submits only a subset of inputs (e.g. Text + Image, missing Audio), treating the missing input as zero features introduces false signaling. 

We resolve this by applying a boolean **modality mask** $M \in \{\text{True}, \text{False}\}^{B \times 3}$ to the PyTorch Multi-head Attention layer:
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}} + M\right) V$$

Where:
* $M_{ij} = -\infty$ if modality $j$ is missing (unsupervised padding).
* $M_{ij} = 0$ if modality $j$ is present.

This forces the attention mechanism to completely ignore the missing modality token's queries and keys during softmax calculation.

### C. Pooling and Classification
Following attention pooling, the sequence is averaged over active/non-masked tokens and passed through a classification head:
$$\text{Logits} = \text{MLP}(\text{GlobalAveragePool}(H_{attn})) \in \mathbb{R}^7$$

This maps directly to our 7 emotional targets: `[Happy, Sad, Angry, Fear, Surprise, Disgust, Neutral]`.
