# Dataset Strategy & Acquisition Roadmap — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 0 Foundation)  
**Status**: Formal Strategy (No datasets downloaded or trained in Phase 0)  

---

## 1. Objective & Guidelines

> [!IMPORTANT]
> **PHASE 0 INSTRUCTION**:  
> In Phase 0, **no external datasets are downloaded, preprocessed, or used for training**.  
> This document specifies the rigorous evaluation standards, licensing requirements, and acquisition protocols for future research phases (Phase 1+).

To transition MindSense from prototype status to an empirical research platform, all future experiments will execute on verified, peer-reviewed public benchmarks under strict subject-independent partitioning rules.

---

## 2. Dataset Quality & Architectural Requirements

Future dataset candidate integrations must satisfy all of the following seven criteria:

1. **Legitimate Public Availability**: Must be peer-reviewed, publicly documented, and distributed under verified academic or open research licenses.
2. **Temporal & Multimodal Alignment**: Must provide time-aligned raw media or extracted features across at least two (preferably three) target modalities:
   - Text (transcriptions/subtitles),
   - Speech Audio (WAV waveforms / spectrograms),
   - Facial Vision (video frames / face crops).
3. **Standardized Affective Ground Truth**: Clear emotion taxonomies (e.g., discrete classes: Happy, Sad, Angry, Fear, Surprise, Disgust, Neutral; or dimensional: Valence-Arousal-Dominance).
4. **Explicit Speaker/Actor Identifiers**: Must provide speaker/subject IDs to enable strict subject-independent (Leave-One-Speaker-Out) evaluation.
5. **No Identity Leakage**: No individual speaker or video source may appear in both training and evaluation subsets.
6. **Preprocessing Reproducibility**: Exact determinism in audio sampling rates (16 kHz mono), image resolutions ($224\times 224$ or $48\times 48$), and text tokenization.
7. **Licensing Compliance**: Full compliance with academic research data use agreements (DUAs).

---

## 3. Primary Benchmark Datasets Under Investigation (Phase 1+)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               BENCHMARK CANDIDATES                                     │
├───────────┬──────────────┬────────────────────────┬──────────────────────┬─────────────┤
│ Dataset   │ Modalities   │ Emotion Classes        │ Subjects / Dialogues │ Primary Use │
├───────────┼──────────────┼────────────────────────┼──────────────────────┼─────────────┤
│ IEMOCAP   │ Audio, Text, │ 4–6 discrete classes   │ 10 actors            │ Acoustic &  │
│           │ Motion/Video │ (Neutral, Happy, etc.) │ (5 dyadic sessions)  │ Dialogue    │
├───────────┼──────────────┼────────────────────────┼──────────────────────┼─────────────┤
│ MELD      │ Text, Audio, │ 7 discrete classes     │ ~47 actors (Friends) │ Multi-party │
│           │ Video        │ (Ekman 6 + Neutral)    │ 1,433 dialogues      │ Conversat.  │
├───────────┼──────────────┼────────────────────────┼──────────────────────┼─────────────┤
│ CMU-MOSEI │ Text, Audio, │ Continuous sentiment + │ >1,000 YouTube       │ Naturalistic│
│           │ Video        │ 6 Ekman emotion scores │ speakers / videos    │ In-the-Wild │
└───────────┴──────────────┴────────────────────────┴──────────────────────┴─────────────┘
```

---

### 3.1 IEMOCAP (Interactive Emotional Dyadic Motion Capture Database)
* **Institution**: University of Southern California (USC SAIL).
* **Modalities**: Spoken audio (16 kHz WAV), verbatim transcripts, video recordings, facial motion capture markers.
* **Volume**: ~12 hours of recorded dyadic interaction across 5 sessions (10 distinct actors: 5 male, 5 female).
* **Labeling**: Categorical (Happy, Sad, Angry, Fearful, Excited, Frustrated, Neutral) and Dimensional (Valence, Activation, Dominance).
* **Splitting Protocol**: 5-fold Leave-One-Session-Out cross-validation (evaluating on the 2 unseen actors per fold).
* **Licensing**: Academic Research DUA via USC SAIL.

---

### 3.2 MELD (Multimodal EmotionLines Dataset)
* **Institution**: Nanyang Technological University & University of Michigan.
* **Modalities**: Text dialogue turns, extracted audio clips, raw video face crops.
* **Volume**: 13,000+ utterances from 1,433 dialogue clips taken from the *Friends* television series.
* **Labeling**: 7 discrete classes (Anger, Disgust, Fear, Joy, Neutral, Sadness, Surprise) plus sentiment polarity.
* **Splitting Protocol**: Standard train/val/test splits partitioned at the dialogue and episode level.
* **Licensing**: Open academic research release.

---

### 3.3 CMU-MOSEI (CMU Multimodal Opinion Sentiment and Emotion Intensity)
* **Institution**: Carnegie Mellon University (CMU Multimodal Language Lab).
* **Modalities**: Text transcripts, audio prosodic features (COVAREP), facial action units (Facet/OpenFace).
* **Volume**: 23,453 annotated video segments from 1,000+ distinct speakers on YouTube.
* **Labeling**: Continuous sentiment scale $[-3.0, +3.0]$ and 6 discrete Ekman emotion intensity scores $[0, 3]$.
* **Splitting Protocol**: Standard speaker-independent train (16,326), validation (1,871), and test (4,659) sets.
* **Licensing**: Open research license (CMU).

---

## 4. Preprocessing Determinism & Artifact Pipeline

To guarantee complete reproducibility across experiments, the future preprocessing pipeline will adhere to fixed deterministic specifications:

1. **Text Standardization**:
   - Clean UTF-8 normalization, lowercased string sanitization.
   - Deterministic subword tokenization (HuggingFace tokenizers with fixed vocabulary hash).
2. **Audio Standardization**:
   - Fixed sampling rate: Resampled to 16,000 Hz single-channel mono PCM.
   - Length normalization: Fixed duration windowing (3.0s or 5.0s) with zero-padding and truncation.
   - Spectral feature extraction: 13/40-band MFCC or log-mel filterbanks with deterministic FFT parameters ($N_{\text{fft}}=512$, hop length $= 160$).
3. **Vision Standardization**:
   - Face bounding box extraction: MTCNN / MediaPipe face mesh cropping with fixed margin padding ($+10\%$).
   - Resolution: $224 \times 224 \times 3$ RGB (or $48 \times 48 \times 1$ grayscale baseline) normalized to zero mean and unit variance.

---

## 5. Phase 0 Compliance Guarantee

No automated downloading scripts, scrapers, or dataset caches are triggered during Phase 0. Dataset onboarding will commence strictly in Phase 1 according to these written standards.
