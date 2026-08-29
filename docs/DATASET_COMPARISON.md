# Multimodal Emotion Dataset Comparison & Scientific Evaluation — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 1 Systematic Evaluation)  
**Date**: August 2026  
**Status**: Formal Evaluation Completed  

---

## 1. Comparative Dataset Overview

To select the primary benchmark for MindSense Phase 1 and establish secondary candidates for subsequent cross-dataset experiments, we systematically evaluate the three leading corpora in affective computing: **IEMOCAP**, **MELD**, and **CMU-MOSEI**.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATASET COMPARISON MATRIX                                            │
├───────────────────┬────────────────────────────┬────────────────────────────┬──────────────────────────┤
│ Dimension         │ IEMOCAP                    │ MELD                       │ CMU-MOSEI                │
├───────────────────┼────────────────────────────┼────────────────────────────┼──────────────────────────┤
│ Official Source   │ USC SAIL Lab               │ NTU & Univ of Michigan     │ CMU Multimodal Lang Lab  │
│ Publication       │ Busso et al. (LREC 2008)   │ Poria et al. (ACL 2019)    │ Zadeh et al. (ACL 2018)  │
│ Modalities        │ Text, Audio, Video/MoCap   │ Text, Audio, Video         │ Text, Audio, Video       │
│ Participants      │ 10 actors (5 sessions)     │ ~47 actors (6 core Friends)│ >1,000 YouTube speakers  │
│ Total Utterances  │ 10,039 turns (~12 hours)   │ 13,708 turns (1,433 clips) │ 23,453 sentence clips    │
│ Emotion Labels    │ 4–6 discrete classes       │ 7 discrete classes         │ Continuous sentiment +   │
│                   │ (Neutral, Happy, Sad, etc.)│ (Ekman 6 + Neutral)        │ 6 emotion intensities    │
│ Label Format      │ Mutually exclusive majority│ Mutually exclusive discrete│ Multi-label intensity    │
│ Multimodal Align  │ Utterance-level manual     │ Utterance-level dialogue   │ Word-level & segment     │
│ Speaker Metadata  │ Explicit Actor ID (Ses01M) │ Explicit Speaker Name      │ Video & Speaker IDs      │
│ Access Control    │ Restricted DUA (USC approval│ Open Academic Download     │ Open Academic Download   │
│ Commercial Use    │ Strictly Prohibited        │ Non-commercial (Fair Use)  │ Non-commercial Research  │
│ Redistribution    │ Strictly Prohibited        │ Non-commercial / Citations │ Non-commercial / CMU DUA │
│ Research Fit (P1) │ Ideal audio-visual dyadic  │ Ideal 7-class multimodal   │ Ideal for generalization │
└───────────────────┴────────────────────────────┴────────────────────────────┴──────────────────────────┘
```

---

## 2. Granular Dataset Profiles

### 2.1 IEMOCAP (Interactive Emotional Dyadic Motion Capture Database)

- **Official Source**: Speech Analysis and Interpretation Laboratory (SAIL), University of Southern California (USC).
- **Publication**: Busso, C., Bulut, M., Lee, C. C., Kazemzadeh, A., Mower, E., Kim, S., Chang, J. N., Lee, S., & Narayanan, S. (2008). *IEMOCAP: Interactive emotional dyadic motion capture database*. Language Resources and Evaluation, 42(4), 335-359.
- **Modalities**:
  - Text: Detailed manual transcriptions with word-level start/end timestamps.
  - Audio: 16 kHz uncompressed 16-bit PCM WAV (studio microphone recordings).
  - Vision: High-resolution video and facial motion capture marker coordinates ($x, y, z$).
- **Participants**: 10 professional actors (5 male, 5 female) recorded in 5 dyadic interaction sessions (Scripted and Improvised scenarios).
- **Data Structure**:
  - `Session1` to `Session5` containing `dialog/transcriptions/`, `sentences/wav/`, `dialog/EmoEvaluation/`.
- **Emotion Labels & Semantics**:
  - Categorical: Neutral, Happiness, Sadness, Anger, Surprise, Fear, Disgust, Frustration, Excited.
  - Dimensional: Valence, Activation, Dominance (1–5 scale from multiple human evaluators).
  - Common 4-class benchmark standard: Neutral, Happy+Excited, Sad, Angry (~5,531 utterances).
- **Alignment Properties**: Perfectly aligned at the conversational turn/utterance level.
- **Train/Test Protocol**: 5-fold Leave-One-Session-Out (LOSO) cross-validation (evaluating on the 2 unseen actors per fold).
- **Licensing & Access Restrictions**:
  - Access requires completing an institutional Data Use Agreement (DUA) signed by a faculty advisor or university official.
  - Requires institutional email verification with manual review by USC SAIL.
  - **Commercial Use**: Prohibited.
  - **Redistribution**: Strictly prohibited. Raw files cannot be hosted in public Git repositories.
  - **Local Storage**: Required on secure, access-controlled local filesystems.
- **Research Appropriateness**: Exceptional for dyadic acoustic-prosodic and dialogue research, but restricted manual DUA approval makes it inaccessible for immediate zero-barrier automated CI pipeline execution.

---

### 2.2 MELD (Multimodal EmotionLines Dataset)

- **Official Source**: Nanyang Technological University (NTU), Singapore & University of Michigan.
- **Publication**: Poria, S., Hazarika, D., Majumder, N., Gautam, G., Saurabh, A., & Rada, M. (2019). *MELD: A Multimodal Multi-Party Dataset for Emotion Recognition in Conversations*. In Proceedings of the 57th Annual Meeting of the Association for Computational Linguistics (ACL), pp. 527–536.
- **Modalities**:
  - Text: Full dialogue transcript string.
  - Audio: 16 kHz mono WAV extracted from MP4 audio tracks.
  - Vision: Video clips (MP4, 720p/480p) featuring actor facial crops and dialogue contexts.
- **Participants**: ~47 distinct named actors across the television series *Friends* (6 core protagonists: Rachel, Monica, Phoebe, Joey, Chandler, Ross, plus recurring supporting actors).
- **Data Structure**:
  - `train_sent_emo.csv`, `dev_sent_emo.csv`, `test_sent_emo.csv`.
  - Video clips named `dia{dialogue_id}_utt{utterance_id}.mp4`.
- **Emotion Labels & Semantics**:
  - 7 discrete classes: `neutral`, `joy` (Happy), `sadness`, `anger`, `fear`, `surprise`, `disgust`.
  - Also provides Sentiment polarity: `positive`, `neutral`, `negative`.
  - **Direct Label Alignment**: Maps 1-to-1 with the Ekman 6 primary emotions + Neutral used across affective computing literature and our baseline research taxonomy.
- **Alignment Properties**: Utterance-level temporal alignment across audio, text transcript, and video clip.
- **Train/Test Protocol**:
  - Train: 9,989 utterances (1,038 dialogues).
  - Validation (Dev): 1,109 utterances (114 dialogues).
  - Test: 2,610 utterances (280 dialogues).
  - Pre-split at the dialogue episode level; can be partitioned further by speaker name for strict subject isolation.
- **Licensing & Access Restrictions**:
  - Open academic research release under GitHub / NTU research license.
  - Downloadable directly via public URLs / tarballs without manual institutional access review.
  - **Commercial Use**: Non-commercial academic research under Fair Use.
  - **Redistribution**: Code and manifests permitted; media assets downloaded via automated pipeline.
  - **Local Storage**: Processed feature caches and manifests stored locally.
- **Research Appropriateness**: Superb fit for Phase 1. Provides complete multimodal triples (text, audio, vision), discrete 7-class emotion annotations matching our classifier taxonomy, explicit speaker metadata, and immediate open accessibility.

---

### 2.3 CMU-MOSEI (CMU Multimodal Opinion Sentiment and Emotion Intensity)

- **Official Source**: Carnegie Mellon University Multimodal Communication and Machine Learning Laboratory (CMU-LTI).
- **Publication**: Zadeh, A., Liang, P. P., Poria, S., Cambria, E., & Morency, L. P. (2018). *Multimodal Language Analysis in the Wild: CMU-MOSEI Dataset and Multimodal Research Hub*. In Proceedings of the 56th Annual Meeting of the Association for Computational Linguistics (ACL), pp. 2236–2246.
- **Modalities**:
  - Text: Transcribed YouTube monologue utterances.
  - Audio: 16 kHz WAV and pre-extracted acoustic features (COVAREP, opensmile).
  - Vision: Full face crops and OpenFace facial action unit indicators ($AU_1, AU_2, \dots$).
- **Participants**: 1,000+ distinct individual speakers from YouTube monologue videos.
- **Data Structure**:
  - Packaged via CMU Multimodal SDK (`mmdata` / `cmu-multimodal-sdk`) and raw HDF5/CSV segment tables.
- **Emotion Labels & Semantics**:
  - Continuous sentiment score in $[-3.0, +3.0]$.
  - Six continuous emotion intensity ratings in $[0, 3]$ for: `happiness`, `sadness`, `anger`, `fear`, `surprise`, `disgust`.
  - **Crucial Label Difference**: Labels are **continuous multi-attribute intensities** where multiple emotions co-occur with non-zero intensity in a single utterance, rather than mutually exclusive single-class discrete integers.
- **Alignment Properties**: Word-level aligned or segment-level aligned feature matrices.
- **Train/Test Protocol**: Standard speaker-independent split: Train (16,326), Val (1,871), Test (4,659).
- **Licensing & Access Restrictions**:
  - Open academic research license through CMU Multimodal SDK.
  - Non-commercial academic research use.
- **Research Appropriateness**: Exceptional benchmark for cross-dataset generalization (Experiment `E13`), but requires multi-label regression/classification heads rather than the discrete 7-class single-label taxonomy of Phase 1.

---

## 3. Label Semantic Mapping Analysis

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               LABEL TAXONOMY COMPARISON                                │
├──────────────────────────────┬──────────────────────────────┬──────────────────────────┤
│ Prototype / MindSense Target │ MELD Categorical             │ CMU-MOSEI Intensity      │
├──────────────────────────────┼──────────────────────────────┼──────────────────────────┤
│ happy (0)                    │ joy                          │ happiness ∈ [0, 3]       │
│ sad (1)                      │ sadness                      │ sadness ∈ [0, 3]         │
│ angry (2)                    │ anger                        │ anger ∈ [0, 3]           │
│ fear (3)                     │ fear                         │ fear ∈ [0, 3]            │
│ surprise (4)                 │ surprise                     │ surprise ∈ [0, 3]        │
│ disgust (5)                  │ disgust                      │ disgust ∈ [0, 3]         │
│ neutral (6)                  │ neutral                      │ sentiment == 0, all E=0  │
└──────────────────────────────┴──────────────────────────────┴──────────────────────────┘
```

### Scientific Decision on Label Compatibility:
1. **MELD maps 1-to-1** with the target discrete 7-class emotion taxonomy without semantic loss or arbitrary thresholding.
2. **IEMOCAP** requires merging `happiness` and `excited` or dropping `frustration`, creating a 4-class or 6-class sub-task.
3. **CMU-MOSEI** requires continuous regression or multi-label binarization ($I > 0$). It is scientifically unsound to force CMU-MOSEI into single-label multi-class cross-entropy without explicit multi-label sigmoid heads.

---

## 4. Conclusion

- **Primary Dataset Selected for Phase 1**: **MELD** (due to complete 7-class discrete alignment, open access, multi-modal triples, and speaker metadata).
- **Secondary Dataset Designated for Cross-Dataset Evaluation (Phase 2+)**: **CMU-MOSEI** and **IEMOCAP**.
