"""
Unit & Integration Tests for Audio Extraction, MFCC Shape, & Strict Baseline Validation — MindSense
"""

import os
import tempfile
import pytest
import numpy as np
import torch
from pathlib import Path

from backend.app.ml.data.config import get_meld_root, AUDIO_TARGET_FRAMES, AUDIO_NUM_MFCC, AUDIO_SAMPLE_RATE
from backend.app.ml.data.prepare_meld import inspect_media_streams
from backend.app.ml.preprocessing.audio import (
    extract_audio_waveform, extract_mfcc, preprocess_audio
)
from backend.app.ml.data.preprocessing import DatasetPreprocessor
from backend.app.ml.data.manifest import SampleRecord
from backend.app.ml.data.dataset import MultimodalEmotionDataset


def get_real_sample_mp4() -> Path:
    """Helper to locate a real MELD MP4 file if present on disk."""
    meld_root = get_meld_root()
    train_sample = meld_root / "train_splits" / "dia0_utt0.mp4"
    if train_sample.exists():
        return train_sample
    
    # Check other splits
    dev_sample = meld_root / "dev_splits_complete" / "dia0_utt0.mp4"
    if dev_sample.exists():
        return dev_sample

    test_sample = meld_root / "output_repeated_splits_test" / "dia0_utt0.mp4"
    if test_sample.exists():
        return test_sample

    pytest.skip(f"No real MELD MP4 files found in {meld_root}")


def test_valid_meld_mp4_opens_with_ffprobe():
    sample_mp4 = get_real_sample_mp4()
    assert sample_mp4.exists()
    assert sample_mp4.stat().st_size > 0

    has_video, has_audio, duration_sec = inspect_media_streams(sample_mp4)
    assert has_video is True
    assert has_audio is True
    assert duration_sec is not None
    assert duration_sec > 0.0


def test_invalid_and_corrupted_mp4_rejected():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        # 1. Non-existent file
        has_v, has_a, dur = inspect_media_streams(tmp_path / "nonexistent.mp4")
        assert has_v is False
        assert has_a is False
        assert dur is None

        # 2. Empty 0-byte file
        empty_file = tmp_path / "empty.mp4"
        empty_file.write_bytes(b"")
        has_v, has_a, dur = inspect_media_streams(empty_file)
        assert has_v is False
        assert has_a is False
        assert dur is None

        # 3. Corrupted random bytes file
        corrupt_file = tmp_path / "corrupt.mp4"
        corrupt_file.write_bytes(b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00random_garbage_corrupt_data")
        has_v, has_a, dur = inspect_media_streams(corrupt_file)
        assert has_v is False
        assert has_a is False
        assert dur is None


def test_audio_extraction_and_mfcc_shape_on_real_meld():
    sample_mp4 = get_real_sample_mp4()

    # 1. Extract 16kHz waveform directly
    waveform = extract_audio_waveform(sample_mp4, target_sample_rate=AUDIO_SAMPLE_RATE)
    assert isinstance(waveform, np.ndarray)
    assert waveform.ndim == 1
    assert len(waveform) > 0
    assert np.count_nonzero(waveform) > 0
    assert np.max(np.abs(waveform)) > 0.0
    assert not np.isnan(waveform).any()

    # 2. Compute MFCCs
    raw_mfcc = extract_mfcc(waveform, samplerate=AUDIO_SAMPLE_RATE, num_cepstra=AUDIO_NUM_MFCC)
    assert raw_mfcc.shape[1] == AUDIO_NUM_MFCC
    assert raw_mfcc.shape[0] > 0

    # 3. Full preprocessing with target padding (200, 13)
    mfcc_feat = preprocess_audio(sample_mp4, target_frames=AUDIO_TARGET_FRAMES, num_mfcc=AUDIO_NUM_MFCC, strict=True)
    assert mfcc_feat.shape == (AUDIO_TARGET_FRAMES, AUDIO_NUM_MFCC)
    assert mfcc_feat.dtype == np.float32
    assert not (mfcc_feat == 0).all()


def test_extraction_failure_raises_error_in_strict_mode():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        bad_file = tmp_path / "broken.mp4"
        bad_file.write_bytes(b"invalid_mp4_header_and_data")

        # In strict mode, preprocess_audio should raise RuntimeError
        with pytest.raises(RuntimeError):
            preprocess_audio(bad_file, strict=True)

        # DatasetPreprocessor in strict mode should raise RuntimeError or FileNotFoundError
        preprocessor = DatasetPreprocessor(strict_paths=True)
        with pytest.raises((RuntimeError, FileNotFoundError, ValueError)):
            preprocessor.process_audio(bad_file)


def test_no_zero_tensor_fallback_in_strict_dataset_mode():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        bad_mp4 = tmp_path / "broken_sample.mp4"
        bad_mp4.write_bytes(b"corrupted_stream_data")

        record = SampleRecord(
            sample_id="test_sample_strict",
            dataset="meld",
            speaker_id="speaker_0",
            session_id="session_0",
            utterance_id="utt0",
            text_content="Strict test utterance",
            has_text=True,
            has_audio=True,
            has_vision=False,
            label="neutral",
            label_id=0,
            original_label="neutral",
            label_source="test",
            split="train",
            quality_status="valid",
            audio_path=str(bad_mp4)
        )

        preprocessor = DatasetPreprocessor(strict_paths=True)
        ds = MultimodalEmotionDataset([record], active_modalities=["audio"], preprocessor=preprocessor)

        # Attempting __getitem__ with strict preprocessor on broken file must raise RuntimeError, never return silent zeros
        with pytest.raises(RuntimeError):
            _ = ds[0]
