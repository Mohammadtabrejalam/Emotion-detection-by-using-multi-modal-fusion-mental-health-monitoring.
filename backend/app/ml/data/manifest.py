"""
Dataset Manifest Management & Serialization — MindSense
"""

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
from .label_mapping import normalize_label, LabelMappingResult


@dataclass
class SampleRecord:
    sample_id: str
    dataset: str
    speaker_id: str
    session_id: str
    utterance_id: str
    text_content: str
    has_text: bool
    has_audio: bool
    has_vision: bool
    label: str
    label_id: int
    original_label: str
    label_source: str
    split: str
    quality_status: str
    text_path: Optional[str] = None
    audio_path: Optional[str] = None
    video_path: Optional[str] = None
    duration_sec: Optional[float] = None
    sample_rate: Optional[int] = 16000
    frame_count: Optional[int] = 200

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SampleRecord":
        return cls(
            sample_id=data["sample_id"],
            dataset=data["dataset"],
            speaker_id=data["speaker_id"],
            session_id=data["session_id"],
            utterance_id=data["utterance_id"],
            text_content=data["text_content"],
            has_text=data.get("has_text", True),
            has_audio=data.get("has_audio", False),
            has_vision=data.get("has_vision", False),
            label=data["label"],
            label_id=data["label_id"],
            original_label=data["original_label"],
            label_source=data.get("label_source", "unknown"),
            split=data["split"],
            quality_status=data.get("quality_status", "valid"),
            text_path=data.get("text_path"),
            audio_path=data.get("audio_path"),
            video_path=data.get("video_path"),
            duration_sec=data.get("duration_sec"),
            sample_rate=data.get("sample_rate", 16000),
            frame_count=data.get("frame_count", 200),
        )


class DatasetManifest:
    def __init__(self, records: Optional[List[SampleRecord]] = None):
        self.records: List[SampleRecord] = records or []
        self._index: Dict[str, SampleRecord] = {r.sample_id: r for r in self.records}

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, idx: int) -> SampleRecord:
        return self.records[idx]

    def add_record(self, record: SampleRecord) -> None:
        if record.sample_id in self._index:
            raise ValueError(f"Duplicate sample_id detected in manifest: '{record.sample_id}'")
        self.records.append(record)
        self._index[record.sample_id] = record

    def get_by_id(self, sample_id: str) -> Optional[SampleRecord]:
        return self._index.get(sample_id)

    def filter_by_split(self, split: str) -> List[SampleRecord]:
        return [r for r in self.records if r.split == split]

    def filter_by_speaker(self, speaker_id: str) -> List[SampleRecord]:
        return [r for r in self.records if r.speaker_id == speaker_id]

    def get_speakers(self) -> List[str]:
        return sorted(list(set(r.speaker_id for r in self.records)))

    def save_json(self, file_path: Union[str, Path]) -> None:
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        data = [r.to_dict() for r in self.records]
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    @classmethod
    def load_json(cls, file_path: Union[str, Path]) -> "DatasetManifest":
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Manifest file not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        records = [SampleRecord.from_dict(d) for d in data]
        return cls(records)

    def compute_statistics(self) -> Dict[str, Any]:
        total_samples = len(self.records)
        if total_samples == 0:
            return {
                "total_samples": 0,
                "speaker_count": 0,
                "split_distribution": {},
                "class_distribution": {},
                "modality_availability": {
                    "text_available": 0,
                    "audio_available": 0,
                    "vision_available": 0,
                    "complete_triples": 0
                },
                "duration_statistics": {"min_sec": 0, "max_sec": 0, "mean_sec": 0}
            }

        speakers = set(r.speaker_id for r in self.records)
        splits: Dict[str, int] = {}
        classes: Dict[str, int] = {}
        has_text_count = sum(1 for r in self.records if r.has_text)
        has_audio_count = sum(1 for r in self.records if r.has_audio)
        has_vision_count = sum(1 for r in self.records if r.has_vision)
        complete_triples = sum(1 for r in self.records if r.has_text and r.has_audio and r.has_vision)

        durations = [r.duration_sec for r in self.records if r.duration_sec is not None and r.duration_sec > 0]

        for r in self.records:
            splits[r.split] = splits.get(r.split, 0) + 1
            classes[r.label] = classes.get(r.label, 0) + 1

        duration_stats = {
            "min_sec": round(min(durations), 2) if durations else 0.0,
            "max_sec": round(max(durations), 2) if durations else 0.0,
            "mean_sec": round(sum(durations) / len(durations), 2) if durations else 0.0
        }

        return {
            "total_samples": total_samples,
            "speaker_count": len(speakers),
            "split_distribution": splits,
            "class_distribution": classes,
            "modality_availability": {
                "text_available": has_text_count,
                "audio_available": has_audio_count,
                "vision_available": has_vision_count,
                "complete_triples": complete_triples
            },
            "duration_statistics": duration_stats
        }
