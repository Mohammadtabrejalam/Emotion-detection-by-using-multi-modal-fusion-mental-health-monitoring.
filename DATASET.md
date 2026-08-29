# Dataset Adaptability & Separation — MindSense

> [!NOTE]
> **Research Status (Phase 0 Foundation)**: No real-world benchmark datasets are downloaded or trained in Phase 0. External dataset integration specifications and subject-independent evaluation protocols are defined in [docs/DATA_STRATEGY.md](file:///docs/DATA_STRATEGY.md) and [docs/EVALUATION_PROTOCOL.md](file:///docs/EVALUATION_PROTOCOL.md).

MindSense uses modular dataset adapters to allow plugging in external multimodal datasets (e.g., IEMOCAP, MELD, CMU-MOSEI) without modifying core training scripts.

---

## 1. Feature Representation Standards

External datasets must be mapped to the following unified input shapes:

### A. Text Modality
* Standard format: UTF-8 plain text string representing spoken transcripts or journal entries.
* Tokenization: Cleaned and tokenized into sequences of 64 word tokens. Unrecognized words are mapped to `<unk>` index.

### B. Audio Modality
* Standard format: 16kHz mono WAV files.
* Feature matrix: 13 Mel-Frequency Cepstral Coefficients (MFCCs) computed over overlapping window frames of 25ms width and 10ms stride.
* Tensor shape: `[batch_size, 200, 13]`.

### C. Image Modality
* Standard format: Grayscale face-cropped image.
* Preprocessing: Face detection using Haar Cascade, crop, grayscale conversion, and resizing to 48x48.
* Tensor shape: `[batch_size, 1, 48, 48]`.

---

## 2. Preventing Data Leakage

When evaluating multimodal models, naive random splits can lead to significant overestimation of accuracy. This occurs if samples belonging to the same subject (speaker or actor) appear in both the training set and the test set. The model ends up memorizing individual voice qualities or visual signatures rather than learning generic emotional signals.

### Data Leakage Prevention Guidelines:
1. **Subject-level Partitioning**: When splitting the dataset, partition at the subject/person ID level. For example, if there are 10 speakers in the dataset, use speakers 1-8 for training, speaker 9 for validation, and speaker 10 for testing.
2. **Session-level Splitting**: For datasets containing multi-day recordings, ensure whole sessions or days are grouped together to prevent chronological leakage.
3. **No Overlap of Media Files**: Verify that no single media source is used in multiple cropped variants across splits.
