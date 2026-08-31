# Official MELD Dataset Setup Guide

## Overview
This document describes how to configure the real MELD (Multimodal EmotionLines Dataset) for the MindSense affective processing pipeline without duplicating or committing media assets to version control.

---

## 1. Environment Variable Configuration

To link your external MELD dataset directory to MindSense, set the `MINDSENSE_MELD_ROOT` environment variable.

### Windows Command Prompt (cmd)
```cmd
set MINDSENSE_MELD_ROOT=C:\Users\<YOUR_USERNAME>\Desktop\MELD_DOWNLOAD\MELD.Raw
```

### Windows PowerShell
```powershell
$env:MINDSENSE_MELD_ROOT="C:\Users\<YOUR_USERNAME>\Desktop\MELD_DOWNLOAD\MELD.Raw"
```

### Linux / macOS
```bash
export MINDSENSE_MELD_ROOT=/path/to/MELD.Raw
```

> [!NOTE]
> Do **NOT** hardcode personal Windows paths into source code or commit `.env` files containing personal machine directories to Git.

---

## 2. Directory Structure Requirements

The ingestion parser supports official MELD benchmark directory structures:

```
MELD.Raw/
├── train_sent_emo.csv
├── dev_sent_emo.csv
├── test_sent_emo.csv
├── train_splits/
│   └── dia0_utt0.mp4, dia0_utt1.mp4, ...
├── dev_splits_complete/
│   └── dia0_utt0.mp4, dia0_utt1.mp4, ...
└── output_repeated_splits_test/
    └── dia0_utt0.mp4, dia0_utt1.mp4, ...
```

- `train_splits/` maps to the **train** split partition.
- `dev_splits_complete/` maps to the **validation (dev)** split partition.
- `output_repeated_splits_test/` maps to the **test** split partition.
- MP4 filenames adhere to `dia{Dialogue_ID}_utt{Utterance_ID}.mp4`.

---

## 3. Modality Derivation Architecture

MindSense processes multimodal utterances into three distinct input streams:

```
                      MELD Utterance MP4
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
     Text Utterance     Audio Stream       Video Frames
     (from CSV text)    (via FFmpeg)      (via OpenCV)
            │                 │                 │
            ▼                 ▼                 ▼
      Text Encoding    Audio Features    Vision Preprocessing
      (Tokenizer)         (MFCCs)         (48x48 Crops)
```

- **Text Modality**: Extracted from the `Utterance` column in official annotation CSVs.
- **Audio Modality**: Audio stream extracted from the MP4 container via FFmpeg/SciPy (`audio_source_path = MP4`).
- **Vision Modality**: Facial video frames sampled from the MP4 container via OpenCV (`image_source_path = MP4`).
