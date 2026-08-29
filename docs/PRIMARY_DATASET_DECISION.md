# Primary Dataset Selection & Acquisition Decision — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 1 Decision Record)  
**Date**: August 2026  
**Status**: Formal Decision Approved  

---

## 1. Primary Dataset Selection: MELD

> **Selected Primary Dataset**: **MELD (Multimodal EmotionLines Dataset)**  
> **Source**: Nanyang Technological University (NTU) & University of Michigan (Poria et al., ACL 2019)  
> **Licensing**: Open Academic Research Use (Fair Use / Academic Distribution)  

---

## 2. Selection Rationale & Comparative Justification

The selection of **MELD** over IEMOCAP and CMU-MOSEI as the Primary Dataset for Phase 1 is grounded in six scientific and methodological considerations:

1. **Exact 7-Class Discrete Taxonomy Match**:
   MELD annotations (`neutral`, `joy`, `sadness`, `anger`, `fear`, `surprise`, `disgust`) correspond directly to the standard Ekman 6 + Neutral classification space utilized by our model architecture and wellness monitoring pipeline.
2. **Synchronized Multimodal Triples**:
   Every sample in MELD consists of a verbatim dialogue transcript string (Text), an extracted 16 kHz audio track (Audio), and a corresponding video clip with facial expressions (Vision), permitting true 3-modality intermediate fusion.
3. **Rich Conversational Context & Multi-Speaker Dynamics**:
   Unlike acted monologues, MELD contains naturalistic conversational turns across ~47 speakers with varied acoustics, visual expressions, and contextual cues.
4. **Reproducible Open Academic Access**:
   MELD is publicly downloadable without manual institutional gating or faculty-signed paper DUAs, ensuring that automated verification pipelines, CI workflows, and fellow researchers can reproduce our data pipeline without barrier.
5. **Clear Speaker Metadata for Subject Partitioning**:
   MELD explicitly labels every utterance with the speaker's character name (e.g. `Rachel`, `Monica`, `Chandler`, `Joey`, `Phoebe`, `Ross`, plus guest actors), enabling strict speaker-independent evaluation protocols.
6. **Controlled Preprocessing Complexity**:
   Utterance-level video clips (`.mp4`) allow straightforward extraction of 16 kHz mono WAV audio and 48x48 / 224x224 facial frames via standard tools (OpenCV, FFmpeg, SciPy).

---

## 3. Advantages & Limitations

### Advantages:
- **Direct Label Compatibility**: Zero label conversion loss; no arbitrary thresholding required.
- **Multimodal Completeness**: Text, Audio, and Video available for all 13,708 conversational turns.
- **Ecological Validity**: Spontaneous multi-party conversational interaction with natural overlap, interruptions, and non-verbal reactions.
- **Open Accessibility**: Enables immediate local and automated test pipeline execution.

### Limitations:
- **Class Imbalance**: Over 47% of utterances in MELD are labeled `neutral`, while `fear` and `disgust` constitute <3% of the corpus. (Requires Macro-F1 metric optimization and class-weighted loss).
- **Background Noise & Laugh Tracks**: Studio laughter in certain sitcom scenes introduces background acoustic noise. (This provides a realistic stress test for acoustic robustness in Experiment `E10`).
- **Occasional Multiple Faces in Frame**: In wide camera angles, multiple characters appear. (Resolved via face detection targeting the largest central face bounding box).

---

## 4. Expected Preprocessing & Pipeline Architecture

```
                                  MELD RAW DATASET
                   (train_sent_emo.csv, dev_sent_emo.csv, test_sent_emo.csv)
                                        │
                                        ▼
                   ┌────────────────────────────────────────┐
                   │    MindSense Manifest Generator        │
                   │   (dia{X}_utt{Y}.mp4 / .wav / text)    │
                   └────────────────────┬───────────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
        ┌─────────────────┐    ┌─────────────────┐   ┌───────────────────┐
        │ Text Pipeline   │    │ Audio Pipeline  │   │ Vision Pipeline   │
        │ - Clean string  │    │ - 16 kHz Mono   │   │ - Face Crop (Haar)│
        │ - Tokenize (64) │    │ - 13 MFCCs      │   │ - 48x48 Grayscale │
        │ - Pad / Vocab   │    │ - 200 frames    │   │ - Scaled [0, 1]   │
        └────────┬────────┘    └────────┬────────┘   └─────────┬─────────┘
                 │                      │                      │
                 └──────────────────────┼──────────────────────┘
                                        ▼
                       ┌─────────────────────────────────┐
                       │   PyTorch Multimodal Dataset    │
                       │ (Item: text, audio, vision,     │
                       │  label, mask, speaker, meta)    │
                       └────────────────┬────────────────┘
                                        │
                                        ▼
                       ┌─────────────────────────────────┐
                       │  Collate & Dynamic DataLoader   │
                       │ (Batched Tensors + Masks)       │
                       └─────────────────────────────────┘
```

---

## 5. Secondary Datasets for Cross-Dataset Generalization (Phase 2+)

> [!IMPORTANT]
> **CROSS-DATASET ROADMAP**:  
> In Phase 1, only the Primary Dataset (MELD) is processed into active PyTorch loaders.  
> Secondary datasets are designated for **Phase 2+ Cross-Dataset Generalization Experiments (`E13`)**.

1. **Secondary Dataset 1: IEMOCAP**
   - **Role**: High-fidelity dyadic acoustic-prosodic generalization benchmark.
   - **Label Strategy**: 4-class discrete mapping (`neutral`, `happy+excited`, `sadness`, `anger`) for cross-corpus validation.
2. **Secondary Dataset 2: CMU-MOSEI**
   - **Role**: In-the-wild YouTube monologue generalization and sentiment intensity evaluation.
   - **Label Strategy**: Multi-label continuous regression / thresholded emotion scores.
