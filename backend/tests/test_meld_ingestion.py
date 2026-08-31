"""
Unit Tests for MELD Dataset Ingestion, Path Resolution & Media Stream Validation — MindSense
"""

import os
import tempfile
import pytest
from pathlib import Path

from backend.app.ml.data.config import get_meld_root
from backend.app.ml.data.prepare_meld import (
    find_mp4_for_sample, inspect_media_streams, ingest_meld_dataset
)
from backend.app.ml.data.manifest import SampleRecord, DatasetManifest
from backend.app.ml.data.splits import validate_split_isolation


def test_meld_root_env_variable(monkeypatch):
    with tempfile.TemporaryDirectory() as tmpdir:
        monkeypatch.setenv("MINDSENSE_MELD_ROOT", tmpdir)
        resolved = get_meld_root()
        assert resolved == Path(tmpdir).resolve()


def test_mp4_filename_and_split_directory_resolution():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        train_dir = tmp_path / "train_splits"
        dev_dir = tmp_path / "dev_splits_complete"
        test_dir = tmp_path / "output_repeated_splits_test"

        train_dir.mkdir(parents=True)
        dev_dir.mkdir(parents=True)
        test_dir.mkdir(parents=True)

        # Create dummy MP4 files
        train_mp4 = train_dir / "dia0_utt1.mp4"
        dev_mp4 = dev_dir / "dia5_utt2.mp4"
        test_mp4 = test_dir / "dia10_utt3.mp4"

        train_mp4.write_bytes(b"dummy_mp4_bytes_1234567890")
        dev_mp4.write_bytes(b"dummy_mp4_bytes_1234567890")
        test_mp4.write_bytes(b"dummy_mp4_bytes_1234567890")

        # 1. Test train split resolution
        p_train, err1 = find_mp4_for_sample(tmp_path, "train", 0, 1)
        assert p_train == train_mp4.resolve()
        assert err1 is None

        # 2. Test val split resolution
        p_val, err2 = find_mp4_for_sample(tmp_path, "val", 5, 2)
        assert p_val == dev_mp4.resolve()
        assert err2 is None

        # 3. Test test split resolution
        p_test, err3 = find_mp4_for_sample(tmp_path, "test", 10, 3)
        assert p_test == test_mp4.resolve()
        assert err3 is None


def test_missing_mp4_file_handling():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        p, err = find_mp4_for_sample(tmp_path, "train", 999, 999)
        assert p is None
        assert err is not None
        assert "File not found" in err


def test_invalid_corrupt_mp4_media_stream_inspection():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        # Non-existent file
        has_v1, has_a1, dur1 = inspect_media_streams(tmp_path / "nonexistent.mp4")
        assert has_v1 is False
        assert has_a1 is False
        assert dur1 is None

        # Empty 0-byte file
        empty_mp4 = tmp_path / "empty.mp4"
        empty_mp4.write_bytes(b"")
        has_v2, has_a2, dur2 = inspect_media_streams(empty_mp4)
        assert has_v2 is False
        assert has_a2 is False
        assert dur2 is None


def test_meld_mock_csv_ingestion_and_manifest():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        train_dir = tmp_path / "train_splits"
        train_dir.mkdir(parents=True)

        # Create dummy MP4
        dummy_mp4 = train_dir / "dia0_utt0.mp4"
        dummy_mp4.write_bytes(b"mock_video_bytes_content_here_12345")

        # Create mock CSV
        csv_file = tmp_path / "train_sent_emo.csv"
        csv_file.write_text(
            "Sr No.,Utterance,Speaker,Emotion,Sentiment,Dialogue_ID,Utterance_ID,Season,Episode,StartTime,EndTime\n"
            "1,Hello how are you?,Joey,neutral,neutral,0,0,1,1,00:00:00,00:00:02\n",
            encoding="utf-8"
        )

        manifest_output = tmp_path / "manifest.json"
        manifest = ingest_meld_dataset(
            meld_root=tmp_path,
            output_manifest_path=manifest_output,
            full_validation=False
        )

        assert len(manifest) == 1
        record = manifest[0]
        assert record.sample_id == "meld_train_dia0_utt0"
        assert record.text_content == "Hello how are you?"
        assert record.label == "neutral"
        assert record.has_text is True
        assert record.has_audio is True
        assert record.has_vision is True
        assert record.quality_status == "valid"
        assert record.audio_source_path == str(dummy_mp4.resolve())
        assert record.image_source_path == str(dummy_mp4.resolve())


def test_split_isolation_zero_sample_and_dialogue_leakage():
    r1 = SampleRecord(
        sample_id="meld_train_dia0_utt0", dataset="meld", speaker_id="speaker_joey",
        session_id="train_dia0", utterance_id="utt0", text_content="Hi", has_text=True,
        has_audio=True, has_vision=True, label="neutral", label_id=0, original_label="neutral",
        label_source="meld_official", split="train", quality_status="valid", dialogue_id="train_dia0"
    )
    r2 = SampleRecord(
        sample_id="meld_val_dia0_utt0", dataset="meld", speaker_id="speaker_joey",
        session_id="val_dia0", utterance_id="utt0", text_content="Hello", has_text=True,
        has_audio=True, has_vision=True, label="neutral", label_id=0, original_label="neutral",
        label_source="meld_official", split="val", quality_status="valid", dialogue_id="val_dia0"
    )

    is_valid, errors = validate_split_isolation([r1, r2], allow_speaker_overlap=True)
    assert is_valid is True
    assert len(errors) == 0
