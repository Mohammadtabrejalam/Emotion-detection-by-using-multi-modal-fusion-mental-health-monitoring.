"""
Dataset Integrity & Identity Leakage Automated Test Suite — MindSense
"""

import pytest
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
            has_audio=True,
            has_vision=True,
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
            has_audio=True,
            has_vision=True,
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
            has_audio=True,
            has_vision=True,
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
            has_audio=True,
            has_vision=True,
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
            has_audio=True,
            has_vision=True,
            label="neutral",
            label_id=6,
            original_label="neutral",
            label_source="test",
            split="train",
            quality_status="valid"
        )
    ]

    manifest = DatasetManifest()
    manifest.records = records  # Bypass add_record check to test validator
    report = DatasetValidator.validate_manifest(manifest)

    assert report.is_passed is False
    assert report.duplicate_sample_ids == 1
    assert any("Duplicate sample_id" in err for err in report.validation_errors)
