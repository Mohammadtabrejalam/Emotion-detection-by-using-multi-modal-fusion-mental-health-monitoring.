"""
Automated Data Integrity & Leakage Validation Engine — MindSense
Version: 1.1.0 (Real Dataset Standards)
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any, Set, Tuple, Optional
from .manifest import DatasetManifest, SampleRecord
from .label_mapping import STANDARD_EMOTIONS, normalize_label
from .splits import validate_split_isolation
from .config import MELD_OFFICIAL_COUNTS


@dataclass
class ValidationReport:
    total_samples: int = 0
    valid_samples: int = 0
    invalid_samples: int = 0
    duplicate_sample_ids: int = 0
    unknown_labels: int = 0
    broken_audio_paths: int = 0
    broken_video_paths: int = 0
    empty_text_errors: int = 0
    missing_text_count: int = 0
    missing_audio_count: int = 0
    missing_vision_count: int = 0
    complete_triples_count: int = 0
    total_speakers: int = 0
    total_dialogues: int = 0
    completeness_status: str = "UNKNOWN"
    split_distribution: Dict[str, int] = field(default_factory=dict)
    class_distribution: Dict[str, int] = field(default_factory=dict)
    speaker_leakage_detected: bool = False
    leakage_errors: List[str] = field(default_factory=list)
    validation_errors: List[str] = field(default_factory=list)
    is_passed: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_samples": self.total_samples,
            "valid_samples": self.valid_samples,
            "invalid_samples": self.invalid_samples,
            "duplicate_sample_ids": self.duplicate_sample_ids,
            "unknown_labels": self.unknown_labels,
            "broken_audio_paths": self.broken_audio_paths,
            "broken_video_paths": self.broken_video_paths,
            "empty_text_errors": self.empty_text_errors,
            "missing_text_count": self.missing_text_count,
            "missing_audio_count": self.missing_audio_count,
            "missing_vision_count": self.missing_vision_count,
            "complete_triples_count": self.complete_triples_count,
            "total_speakers": self.total_speakers,
            "total_dialogues": self.total_dialogues,
            "completeness_status": self.completeness_status,
            "split_distribution": self.split_distribution,
            "class_distribution": self.class_distribution,
            "speaker_leakage_detected": self.speaker_leakage_detected,
            "leakage_errors": self.leakage_errors,
            "validation_errors": self.validation_errors,
            "is_passed": self.is_passed
        }


class DatasetValidator:
    """
    Automated validator for dataset manifests. Enforces schema compliance,
    label validity, speaker isolation, physical path integrity, and modality consistency.
    """

    @classmethod
    def validate_manifest(cls, manifest: DatasetManifest, check_disk_files: bool = True) -> ValidationReport:
        report = ValidationReport()
        report.total_samples = len(manifest)

        if report.total_samples == 0:
            report.validation_errors.append("Manifest contains 0 sample records.")
            report.is_passed = False
            return report

        seen_ids: Set[str] = set()
        seen_paths: Set[str] = set()
        speakers: Set[str] = set()
        dialogues: Set[str] = set()
        valid_count = 0
        invalid_count = 0

        for r in manifest.records:
            is_sample_valid = True

            # 1. Duplicate Sample ID Check
            if r.sample_id in seen_ids:
                report.duplicate_sample_ids += 1
                report.validation_errors.append(f"Duplicate sample_id: '{r.sample_id}'")
                is_sample_valid = False
            seen_ids.add(r.sample_id)

            # 2. Speaker and Dialogue Tracking
            if not r.speaker_id or not r.speaker_id.strip():
                report.validation_errors.append(f"Sample '{r.sample_id}' has missing or empty speaker_id.")
                is_sample_valid = False
            else:
                speakers.add(r.speaker_id.strip().lower())

            if r.session_id and r.session_id.strip():
                dialogues.add(r.session_id.strip().lower())

            # 3. Label Validity Check
            mapping_res = normalize_label(r.label, dataset=r.dataset)
            if not mapping_res.is_valid:
                report.unknown_labels += 1
                report.validation_errors.append(
                    f"Sample '{r.sample_id}' has invalid label '{r.label}': {mapping_res.rejection_reason}"
                )
                is_sample_valid = False
            else:
                report.class_distribution[mapping_res.normalized_label] = (
                    report.class_distribution.get(mapping_res.normalized_label, 0) + 1
                )

            # 4. Split Distribution
            split_key = r.split.strip().lower()
            if split_key not in ["train", "val", "dev", "test"]:
                report.validation_errors.append(f"Sample '{r.sample_id}' has invalid split '{r.split}'.")
                is_sample_valid = False
            else:
                report.split_distribution[split_key] = report.split_distribution.get(split_key, 0) + 1

            # 5. Text Integrity
            if r.has_text:
                if not r.text_content or not r.text_content.strip():
                    report.empty_text_errors += 1
                    report.validation_errors.append(f"Sample '{r.sample_id}' has has_text=True but empty text_content.")
                    is_sample_valid = False
            else:
                report.missing_text_count += 1

            # 6. Physical Media Path Integrity (Distinguishing broken path from intended missing modality)
            if r.has_audio:
                if not r.audio_path:
                    report.broken_audio_paths += 1
                    report.validation_errors.append(f"Sample '{r.sample_id}' has has_audio=True but audio_path is null.")
                    is_sample_valid = False
                elif check_disk_files:
                    p = Path(r.audio_path)
                    if not p.exists() or p.stat().st_size == 0:
                        report.broken_audio_paths += 1
                        report.validation_errors.append(f"Sample '{r.sample_id}' audio_path not found on disk: {r.audio_path}")
                        is_sample_valid = False
            else:
                report.missing_audio_count += 1

            if r.has_vision:
                if not r.video_path:
                    report.broken_video_paths += 1
                    report.validation_errors.append(f"Sample '{r.sample_id}' has has_vision=True but video_path is null.")
                    is_sample_valid = False
                elif check_disk_files:
                    p = Path(r.video_path)
                    if not p.exists() or p.stat().st_size == 0:
                        report.broken_video_paths += 1
                        report.validation_errors.append(f"Sample '{r.sample_id}' video_path not found on disk: {r.video_path}")
                        is_sample_valid = False
            else:
                report.missing_vision_count += 1

            # Complete triple check
            if r.has_text and r.has_audio and r.has_vision:
                report.complete_triples_count += 1

            # At least one modality must be present
            if not (r.has_text or r.has_audio or r.has_vision):
                report.validation_errors.append(f"Sample '{r.sample_id}' has all three modalities marked as false/missing.")
                is_sample_valid = False

            if is_sample_valid:
                valid_count += 1
            else:
                invalid_count += 1

        report.valid_samples = valid_count
        report.invalid_samples = invalid_count
        report.total_speakers = len(speakers)
        report.total_dialogues = len(dialogues)

        # Dataset Completeness Assessment
        if report.total_samples >= MELD_OFFICIAL_COUNTS["total_utterances"] * 0.95:
            report.completeness_status = "FULL_BENCHMARK_DATASET"
        elif report.total_samples > 0:
            report.completeness_status = f"PARTIAL_DATASET ({report.total_samples}/{MELD_OFFICIAL_COUNTS['total_utterances']} samples)"
        else:
            report.completeness_status = "EMPTY_DATASET"

        # 7. Split Isolation & Leakage Check
        allow_spk_overlap = any(r.label_source == "meld_official" for r in manifest.records)
        split_valid, leakage_errors = validate_split_isolation(manifest.records, allow_speaker_overlap=allow_spk_overlap)
        report.speaker_leakage_detected = not split_valid
        report.leakage_errors = leakage_errors

        # Overall Status
        report.is_passed = (
            report.invalid_samples == 0 and
            report.duplicate_sample_ids == 0 and
            report.unknown_labels == 0 and
            report.broken_audio_paths == 0 and
            report.broken_video_paths == 0 and
            report.empty_text_errors == 0 and
            not report.speaker_leakage_detected
        )

        return report
