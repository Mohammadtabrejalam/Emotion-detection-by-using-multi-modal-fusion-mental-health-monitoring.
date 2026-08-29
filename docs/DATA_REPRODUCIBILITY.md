# Data Reproducibility & Provenance Record — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 1 Baseline Provenance)  
**Date**: August 2026  
**Status**: Formalized & Frozen  

---

## 1. Dataset & Environment Provenance Record

| Dimension | Specification & Value | Provenance Note |
| :--- | :--- | :--- |
| **Primary Dataset** | MELD (Multimodal EmotionLines Dataset) | Poria et al., ACL 2019 |
| **Dataset Version** | `meld_v1.0_benchmark_manifest` | Standard 7-class Ekman + Neutral |
| **Acquisition Date** | August 30, 2026 | Verified against open research release |
| **Mapping Version** | `1.0.0` | Defined in `backend/app/ml/data/label_mapping.py` |
| **Preprocessing Version**| `1.0.0` | Defined in `backend/app/ml/data/preprocessing.py` |
| **Speaker Split Seed** | `seed = 42` | Multi-seed validation: `[42, 1337, 2026, 7, 999]` |
| **Python Runtime** | `3.10.10` / `3.11+` | Tested on 64-bit Windows / Linux |
| **PyTorch Release** | `2.5.1+cpu` / `2.0+` | `torch>=2.0.0`, `torchvision>=0.15.0` |
| **FastAPI Release** | `0.141.1` | REST API layer |
| **Pytest Release** | `9.1.1` | Automated test runner |
| **NumPy Release** | `2.2.6` | Numerical linear algebra |
| **SciPy Release** | `1.15.3` | MFCC FFT & DCT signal extraction |
| **OpenCV Release** | `4.13.0` | Face detection & bounding crops |
| **Pillow Release** | `12.2.0` | Image array decoding & resizing |

---

## 2. Deterministic Preprocessing Hashes & Hyperparameters

1. **Text Standardization**:
   - `TEXT_MAX_LENGTH`: 64 tokens
   - `TEXT_VOCAB_SIZE`: 1000 tokens
   - Lowercased, stripped punctuation, padded with `<pad>=0`.
2. **Audio MFCC Extraction**:
   - Sampling frequency: 16,000 Hz single-channel mono PCM.
   - Frame length: 25 ms (400 samples).
   - Frame hop stride: 10 ms (160 samples).
   - Mel filterbanks: 26 filters over 512-point FFT.
   - DCT-II coefficients: 13.
   - Normalized sequence length: 200 frames (~2.0 seconds).
3. **Vision Face Normalization**:
   - Target dimensions: $48 \times 48 \times 1$ (Grayscale).
   - Normalization scale: Pixel intensities divided by $255.0 \implies [0.0, 1.0]$.

---

## 3. Data Manifest Artifacts

- **Primary Manifest Location**: `data/manifests/meld_manifest.json`
- **Summary Statistics Location**: `data/manifests/dataset_statistics.json`
- **Validation Command**: `python -m backend.app.ml.data.validate_dataset`
- **Inspection Command**: `python -m backend.app.ml.data.inspect_samples --count 5`
