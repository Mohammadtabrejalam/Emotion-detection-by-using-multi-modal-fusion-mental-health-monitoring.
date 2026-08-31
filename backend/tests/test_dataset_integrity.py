"""
Dataset Integrity & Identity Leakage Automated Test Suite — MindSense
"""

import pytest
from pathlib import Path
from backend.app.ml.data.manifest import SampleRecord, DatasetManifest
from backend.app.ml.data.splits import partition_dataset_by_speaker, validate_split_isolation
from backend.app.ml.data.label_mapping import normalize_label, get_label_id, STANDARD_EMOTIONS
from backend.app.ml.data.validation import DatasetValidator


def test_label_normalization_valid_meld():
    res = normalize_label("joy", dataset="meld")
    assert res.is_valid is True
    assert res.normalized_label == "happy"
    assert res.label_id == 0

    res_neut = normalize_label("neutral", dataset="meld")
    assert res_neut.is_valid is True
    assert res_neut.normalized_label == "neutral"
    assert res_neut.label_id == 6

    res_ang = normalize_label("anger", dataset="meld")
    assert res_ang.is_valid is True
    assert res_ang.normalized_label == "angry"
    assert res_ang.label_id == 2


def test_label_normalization_rejects_unknown():
    res = normalize_label("ecstatic_rage", dataset="meld")
    assert res.is_valid is False
    assert res.normalized_label is None
    assert "Unknown or unmapped" in res.rejection_reason


def test_label_normalization_rejects_ambiguous_iemocap():
    # Frustration requires separate multi-label handling
    res = normalize_label("frustration", dataset="iemocap")
    assert res.is_valid is False
    assert "Frustration is a complex compound" in res.rejection_reason


def test_speaker_independent_partitioning_disjointness():
    records = [
        SampleRecord(
            sample_id=f"sample_{i}",
            dataset="meld",
            speaker_id=f"speaker_{i % 5}",
            session_id=f"dia_{i // 5}",
            utterance_id=f"utt_{i}",
            text_content=f"Utterance text {i}",
            has_text=True,
            has_audio=False,
            has_vision=False,
            label="neutral",
            label_id=6,
            original_label="neutral",
            label_source="test",
            split="train",
            quality_status="valid"
        )
        for i in range(25)
    ]

    partitioned = partition_dataset_by_speaker(records, train_ratio=0.6, val_ratio=0.2, test_ratio=0.2, seed=42)
    is_valid, errors = validate_split_isolation(partitioned)

    assert is_valid is True, f"Split validation failed: {errors}"
    assert len(errors) == 0


def test_leakage_detection_catches_overlapping_speaker():
    # Intentionally inject speaker overlap
    records = [
        SampleRecord(
            sample_id="samp_1",
            dataset="meld",
            speaker_id="speaker_rachel",
            session_id="dia1",
            utterance_id="utt1",
            text_content="Text 1",
            has_text=True,
            has_audio=False,
            has_vision=False,
            label="happy",
            label_id=0,
            original_label="joy",
            label_source="test",
            split="train",
            quality_status="valid"
        ),
        SampleRecord(
            sample_id="samp_2",
            dataset="meld",
            speaker_id="speaker_rachel",  # SAME SPEAKER in TEST!
            session_id="dia2",
            utterance_id="utt2",
            text_content="Text 2",
            has_text=True,
            has_audio=False,
            has_vision=False,
            label="sad",
            label_id=1,
            original_label="sadness",
            label_source="test",
            split="test",
            quality_status="valid"
        )
    ]

    is_valid, errors = validate_split_isolation(records)
    assert is_valid is False
    assert any("Speaker overlap between TRAIN and TEST" in e for e in errors)


def test_validator_catches_duplicate_sample_ids():
    records = [
        SampleRecord(
            sample_id="duplicate_id_001",
            dataset="meld",
            speaker_id="speaker_monica",
            session_id="dia1",
            utterance_id="utt1",
            text_content="Text 1",
            has_text=True,
            has_audio=False,
            has_vision=False,
            label="happy",
            label_id=0,
            original_label="joy",
            label_source="test",
            split="train",
            quality_status="valid"
        ),
        SampleRecord(
            sample_id="duplicate_id_001",  # Duplicate ID
            dataset="meld",
            speaker_id="speaker_monica",
            session_id="dia1",
            utterance_id="utt2",
            text_content="Text 2",
            has_text=True,
            has_audio=False,
            has_vision=False,
            label="neutral",
            label_id=6,
            original_label="neutral",
            label_source="test",
            split="train",
            quality_status="valid"
        )
    ]

    manifest = DatasetManifest()
    manifest.records = records
    report = DatasetValidator.validate_manifest(manifest, check_disk_files=False)

    assert report.is_passed is False
    assert report.duplicate_sample_ids == 1
    assert any("Duplicate sample_id" in err for err in report.validation_errors)


def test_validator_catches_broken_media_path():
    # Record claims has_audio=True with a non-existent file
    record = SampleRecord(
        sample_id="broken_path_sample_01",
        dataset="meld",
        speaker_id="speaker_ross",
        session_id="dia1",
        utterance_id="utt1",
        text_content="Valid text",
        has_text=True,
        has_audio=True,
        has_vision=False,
        label="happy",
        label_id=0,
        original_label="joy",
        label_source="test",
        split="train",
        quality_status="valid",
        audio_path="data/raw/meld/audio/non_existent_audio_file.wav"
    )

    manifest = DatasetManifest([record])
    report = DatasetValidator.validate_manifest(manifest, check_disk_files=True)

    assert report.is_passed is False
    assert report.broken_audio_paths == 1
    assert any("audio_path not found on disk" in err for err in report.validation_errors)


def test_validator_allows_valid_missing_modality():
    # Record correctly reports has_audio=False and audio_path=None
    record = SampleRecord(
        sample_id="valid_missing_modality_01",
        dataset="meld",
        speaker_id="speaker_phoebe",
        session_id="dia1",
        utterance_id="utt1",
        text_content="Text only utterance",
        has_text=True,
        has_audio=False,
        has_vision=False,
        label="happy",
        label_id=0,
        original_label="joy",
        label_source="test",
        split="train",
        quality_status="valid",
        audio_path=None,
        video_path=None
    )

    manifest = DatasetManifest([record])
    report = DatasetValidator.validate_manifest(manifest, check_disk_files=True)

    assert report.is_passed is True
    assert report.broken_audio_paths == 0
    assert report.missing_audio_count == 1
