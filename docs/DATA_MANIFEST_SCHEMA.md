# Dataset Manifest Specification & JSON Schema — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 1 Manifest Specification)  
**Date**: August 2026  
**Status**: Formal Schema Specification  

---

## 1. Overview

To guarantee complete data provenance, eliminate identity leakage, and support missing modalities, all samples ingested into MindSense are registered in a standardized, machine-readable **Dataset Manifest**.

The manifest acts as the single source of truth for the PyTorch `Dataset` and `DataLoader` pipelines.

---

## 2. Granular Field Definitions

| Field Name | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `sample_id` | `string` | Yes | Unique global identifier formatted as `{dataset}_{dialogue_id}_{utterance_id}` | `"meld_dia12_utt3"` |
| `dataset` | `string` | Yes | Source corpus name (`"meld"`, `"iemocap"`, `"cmu_mosei"`) | `"meld"` |
| `speaker_id` | `string` | Yes | Normalized speaker or actor identifier | `"speaker_rachel"` |
| `session_id` | `string` | Yes | Episode / conversation / recording session ID | `"dia12"` |
| `utterance_id` | `string` | Yes | Sequential turn index within the session | `"utt3"` |
| `text_content` | `string` | Yes | Verbatim raw dialogue text string | `"Oh my God, you guys!"` |
| `text_path` | `string` | No | File path to isolated text transcript file if applicable | `null` |
| `audio_path` | `string` | No | Relative path to extracted 16 kHz mono WAV file | `"data/raw/meld/audio/dia12_utt3.wav"` |
| `video_path` | `string` | No | Relative path to video clip or cropped face frame | `"data/raw/meld/video/dia12_utt3.mp4"` |
| `has_text` | `boolean` | Yes | `true` if valid text transcript is present | `true` |
| `has_audio` | `boolean` | Yes | `true` if valid audio file exists and is decodable | `true` |
| `has_vision` | `boolean` | Yes | `true` if valid visual frames exist and are decodable | `true` |
| `label` | `string` | Yes | Normalized standard emotion label (`"happy"`, `"sad"`, etc.) | `"happy"` |
| `label_id` | `integer` | Yes | Standardized 0-indexed integer class ID ($0 \dots 6$) | `0` |
| `original_label`| `string` | Yes | Unmodified raw label string from source corpus | `"joy"` |
| `label_source` | `string` | Yes | Origin of annotation (`"meld_original"`, `"iemocap_consensus"`) | `"meld_original"` |
| `split` | `string` | Yes | Partition assignment (`"train"`, `"val"`, `"test"`) | `"train"` |
| `duration_sec` | `number` | No | Duration of the utterance audio/video in seconds | `2.45` |
| `sample_rate` | `integer` | No | Audio sampling frequency in Hertz | `16000` |
| `frame_count` | `integer` | No | Visual frame count or audio MFCC frame count | `200` |
| `quality_status`| `string`| Yes | Quality assessment (`"valid"`, `"noisy_audio"`, `"no_face"`) | `"valid"` |

---

## 3. JSON Schema Definition (Draft 7)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MindSenseSampleManifest",
  "type": "object",
  "required": [
    "sample_id",
    "dataset",
    "speaker_id",
    "session_id",
    "utterance_id",
    "text_content",
    "has_text",
    "has_audio",
    "has_vision",
    "label",
    "label_id",
    "original_label",
    "label_source",
    "split",
    "quality_status"
  ],
  "properties": {
    "sample_id": { "type": "string", "pattern": "^[a-z0-9_-]+$" },
    "dataset": { "type": "string", "enum": ["meld", "iemocap", "cmu_mosei"] },
    "speaker_id": { "type": "string" },
    "session_id": { "type": "string" },
    "utterance_id": { "type": "string" },
    "text_content": { "type": "string" },
    "text_path": { "type": ["string", "null"] },
    "audio_path": { "type": ["string", "null"] },
    "video_path": { "type": ["string", "null"] },
    "has_text": { "type": "boolean" },
    "has_audio": { "type": "boolean" },
    "has_vision": { "type": "boolean" },
    "label": {
      "type": "string",
      "enum": ["happy", "sad", "angry", "fear", "surprise", "disgust", "neutral"]
    },
    "label_id": { "type": "integer", "minimum": 0, "maximum": 6 },
    "original_label": { "type": "string" },
    "label_source": { "type": "string" },
    "split": { "type": "string", "enum": ["train", "val", "test"] },
    "duration_sec": { "type": ["number", "null"], "minimum": 0.0 },
    "sample_rate": { "type": ["integer", "null"], "minimum": 8000 },
    "frame_count": { "type": ["integer", "null"], "minimum": 1 },
    "quality_status": {
      "type": "string",
      "enum": ["valid", "noisy_audio", "corrupt_audio", "no_face", "multi_face", "missing_modality"]
    }
  }
}
```

---

## 4. Example Concrete Manifest Record

```json
{
  "sample_id": "meld_dia125_utt3",
  "dataset": "meld",
  "speaker_id": "speaker_chandler",
  "session_id": "dia125",
  "utterance_id": "utt3",
  "text_content": "Could I BE any more surprised?",
  "text_path": null,
  "audio_path": "data/raw/meld/audio/dia125_utt3.wav",
  "video_path": "data/raw/meld/video/dia125_utt3.mp4",
  "has_text": true,
  "has_audio": true,
  "has_vision": true,
  "label": "surprise",
  "label_id": 4,
  "original_label": "surprise",
  "label_source": "meld_original",
  "split": "train",
  "duration_sec": 2.18,
  "sample_rate": 16000,
  "frame_count": 200,
  "quality_status": "valid"
}
```
