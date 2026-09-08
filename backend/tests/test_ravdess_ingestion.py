"""
Unit & Integration Tests for RAVDESS Ingestion, Modality Contract, & Zero-Shot Integrity — MindSense
Phase 6: Cross-Dataset Evaluation
"""

import os
import json
import tempfile
import zipfile
import pytest
from pathlib import Path

import torch
from backend.app.ml.data.manifest import SampleRecord, DatasetManifest
from backend.app.ml.data.dataset import MultimodalEmotionDataset
from backend.app.ml.data.validation import DatasetValidator
from backend.app.ml.data.label_mapping import normalize_label, STANDARD_EMOTIONS, LABEL_TO_ID
from backend.app.ml.data.prepare_ravdess import (
    parse_ravdess_filename, get_matching_full_av_filename,
    ingest_ravdess_dataset, locate_ravdess_archives
)
from backend.app.ml.data.config import RAVDESS_OFFICIAL_COUNTS, RAVDESS_STATS_PATH


def test_ravdess_filename_parsing_valid_speech():
    # Audio Speech, Disgust, Normal intensity, Statement 1, Repetition 1, Actor 12 (female)
    fname = "03-01-07-01-01-01-12.wav"
    meta = parse_ravdess_filename(fname)

    assert meta.modality == "03"
    assert meta.vocal_channel == "01"
    assert meta.emotion_code == "07"
    assert meta.intensity == "01"
    assert meta.statement == "01"
    assert meta.repetition == "01"
    assert meta.actor_id == "12"
    assert meta.is_speech is True
    assert meta.is_calm is False
    assert meta.canonical_audio_filename == "03-01-07-01-01-01-12.wav"
    assert meta.canonical_full_av_video_filename == "01-01-07-01-01-01-12.mp4"


def test_ravdess_filename_parsing_song_and_calm():
    # Song trial (vocal_channel = 02)
    song_fname = "03-02-03-01-01-01-01.wav"
    meta_song = parse_ravdess_filename(song_fname)
    assert meta_song.is_speech is False
    assert meta_song.vocal_channel == "02"

    # Calm trial (emotion_code = 02)
    calm_fname = "03-01-02-01-01-01-01.wav"
    meta_calm = parse_ravdess_filename(calm_fname)
    assert meta_calm.is_speech is True
    assert meta_calm.is_calm is True
    assert meta_calm.emotion_code == "02"


def test_ravdess_filename_parsing_rejects_malformed():
    invalid_filenames = [
        "01-02-03.wav",  # too few tokens
        "03-01-01-01-01-01-01-extra.wav",  # too many tokens
        "99-01-01-01-01-01-01.wav",  # invalid modality
        "03-05-01-01-01-01-01.wav",  # invalid vocal channel
        "03-01-99-01-01-01-01.wav",  # invalid emotion code
        "03-01-01-09-01-01-01.wav",  # invalid intensity
        "03-01-01-01-01-01-25.wav",  # invalid actor (>24)
        "random_audio.wav",  # non-conformant
        ""
    ]
    for bad_name in invalid_filenames:
        with pytest.raises(ValueError):
            parse_ravdess_filename(bad_name)


def test_ravdess_7class_label_mapping():
    """
    RAVDESS -> MindSense 7-Class Mapping Contract:
      01 -> neutral   -> label_id 6
      03 -> happy     -> label_id 0
      04 -> sad       -> label_id 1
      05 -> angry     -> label_id 2
      06 -> fear      -> label_id 3
      07 -> disgust   -> label_id 5
      08 -> surprise  -> label_id 4
    """
    expected_mappings = {
        "01": ("neutral", 6),
        "03": ("happy", 0),
        "04": ("sad", 1),
        "05": ("angry", 2),
        "06": ("fear", 3),
        "07": ("disgust", 5),
        "08": ("surprise", 4),
    }

    for code, (expected_name, expected_id) in expected_mappings.items():
        res = normalize_label(code, dataset="ravdess")
        assert res.is_valid is True, f"Code {code} failed validation: {res.rejection_reason}"
        assert res.normalized_label == expected_name, f"Code {code} expected {expected_name}, got {res.normalized_label}"
        assert res.label_id == expected_id, f"Code {code} expected ID {expected_id}, got {res.label_id}"
        assert 0 <= res.label_id <= 6


def test_ravdess_calm_and_unknown_labels_rejected():
    # Calm (02) must be explicitly rejected
    res_calm = normalize_label("02", dataset="ravdess")
    assert res_calm.is_valid is False
    assert res_calm.normalized_label is None
    assert res_calm.label_id is None
    assert "Calm" in res_calm.rejection_reason

    # Unknown codes must be rejected
    for bad_code in ["00", "09", "99", "random"]:
        res_bad = normalize_label(bad_code, dataset="ravdess")
        assert res_bad.is_valid is False
        assert res_bad.normalized_label is None


def test_full_av_video_pairing_resolution():
    audio_fname = "03-01-05-02-02-02-24.wav"
    expected_video_fname = "01-01-05-02-02-02-24.mp4"
    paired = get_matching_full_av_filename(audio_fname)
    assert paired == expected_video_fname


def test_ravdess_modality_contract_and_mask(monkeypatch):
    """
    Contract Requirement:
      - Text is genuinely unavailable (text_content = "", has_text = False).
      - Audio and Vision are present.
      - MultimodalEmotionDataset produces modality mask: [0.0, 1.0, 1.0].
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        dummy_wav = tmp_path / "03-01-01-01-01-01-01.wav"
        dummy_mp4 = tmp_path / "01-01-01-01-01-01-01.mp4"
        dummy_wav.write_bytes(b"dummy_wav_content_bytes_1234567890")
        dummy_mp4.write_bytes(b"dummy_mp4_content_bytes_1234567890")

        record = SampleRecord(
            sample_id="ravdess_03-01-01-01-01-01-01",
            dataset="ravdess",
            speaker_id="01",
            session_id="Actor_01",
            utterance_id="03-01-01-01-01-01-01",
            text_content="",
            has_text=False,
            has_audio=True,
            has_vision=True,
            label="neutral",
            label_id=6,
            original_label="01",
            label_source="ravdess_filename_annotation",
            split="test",
            quality_status="valid",
            audio_path=str(dummy_wav.resolve()),
            video_path=str(dummy_mp4.resolve())
        )

        manifest = DatasetManifest([record])

        # Test with mock preprocessor returning available for audio and vision
        class MockPreprocessor:
            strict_paths = False

            def process_text(self, text):
                return torch.zeros(64, dtype=torch.long), False

            def process_audio(self, path):
                return torch.ones(200, 13), True

            def process_vision(self, path):
                return torch.ones(1, 48, 48), True

        ds = MultimodalEmotionDataset(manifest, preprocessor=MockPreprocessor())
        sample = ds[0]

        mask = sample["modality_mask"]
        expected_mask = torch.tensor([0.0, 1.0, 1.0], dtype=torch.float32)
        assert torch.equal(mask, expected_mask), f"Expected mask [0, 1, 1], got {mask.tolist()}"
        assert sample["dataset"] == "ravdess"
        assert sample["speaker_id"] == "01"
        assert sample["label"].item() == 6


def test_ravdess_ingestion_mock_pipeline():
    """
    Tests full ingestion logic on a controlled mock directory:
      - Generates 60 speech files for Actor 01:
          4 neutral, 8 calm, 8 happy, 8 sad, 8 angry, 8 fear, 8 disgust, 8 surprise.
      - Generates full-AV MP4s.
      - Confirms 60 discovered, 8 calm excluded, 52 eligible retained.
      - Confirms matching full-AV requirement.
      - Confirms zero duplicate IDs and all label IDs in 0..6.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir) / "ravdess_mock"
        audio_dir = root / "audio" / "Actor_01"
        video_dir = root / "video" / "Actor_01"
        audio_dir.mkdir(parents=True)
        video_dir.mkdir(parents=True)

        emotions = ["01", "02", "03", "04", "05", "06", "07", "08"]
        created_speech_audio = 0

        for emo in emotions:
            intensities = ["01"] if emo == "01" else ["01", "02"]
            for inten in intensities:
                for stmt in ["01", "02"]:
                    for rep in ["01", "02"]:
                        trial_stem = f"01-{emo}-{inten}-{stmt}-{rep}-01"
                        wav_path = audio_dir / f"03-{trial_stem}.wav"
                        mp4_path = video_dir / f"01-{trial_stem}.mp4"
                        wav_path.write_bytes(b"dummy_wav")
                        mp4_path.write_bytes(b"dummy_mp4")
                        created_speech_audio += 1

        assert created_speech_audio == 60

        output_manifest = root / "test_manifest.json"
        output_stats = root / "test_statistics.json"

        # Record canonical statistics file state before running mock ingestion
        canonical_exists_before = RAVDESS_STATS_PATH.exists()
        canonical_content_before = RAVDESS_STATS_PATH.read_text(encoding="utf-8") if canonical_exists_before else None

        manifest, stats = ingest_ravdess_dataset(
            ravdess_root=root,
            output_manifest_path=output_manifest,
            output_stats_path=output_stats,
            extract_if_needed=False,
            strict_official_counts=False
        )

        # Verify mock stats were saved to the injected temporary path
        assert output_stats.exists(), "Mock test statistics file was not created at temporary path"
        with open(output_stats, "r", encoding="utf-8") as f:
            mock_saved_stats = json.load(f)
        assert mock_saved_stats["total_samples"] == 52
        assert mock_saved_stats["eligible_trials"] == 52
        assert mock_saved_stats["speech_audio_discovered"] == 60
        assert mock_saved_stats["calm_trials_excluded"] == 8

        # CRITICAL: Verify canonical statistics file was completely untouched by the mock test
        if canonical_exists_before:
            assert RAVDESS_STATS_PATH.exists()
            assert RAVDESS_STATS_PATH.read_text(encoding="utf-8") == canonical_content_before, (
                "Canonical ravdess_statistics.json was modified by mock pipeline test!"
            )

        assert stats["speech_audio_discovered"] == 60
        assert stats["calm_trials_excluded"] == 8
        assert stats["eligible_trials"] == 52
        assert len(manifest) == 52

        for r in manifest.records:
            assert r.dataset == "ravdess"
            assert r.speaker_id == "01"
            assert r.split == "test"
            assert r.has_text is False
            assert r.text_content == ""
            assert r.has_audio is True
            assert r.has_vision is True
            assert r.label_id in range(7)
            assert r.original_label != "02"
            assert r.label_source == "ravdess_filename_annotation"
            assert Path(r.audio_path).exists()
            assert Path(r.video_path).exists()
            assert Path(r.video_path).name.startswith("01-")

        # Validation suite check
        report = DatasetValidator.validate_manifest(manifest, check_disk_files=True)
        assert report.duplicate_sample_ids == 0
        assert report.unknown_labels == 0
        assert report.broken_audio_paths == 0
        assert report.broken_video_paths == 0
        assert report.is_passed is True


def test_ravdess_ingestion_catches_missing_video_integrity_violation():
    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        audio_dir = root / "audio"
        audio_dir.mkdir(parents=True)
        # Create eligible audio without matching video
        wav_path = audio_dir / "03-01-05-01-01-01-01.wav"
        wav_path.write_bytes(b"dummy_wav")

        with pytest.raises(RuntimeError) as exc_info:
            ingest_ravdess_dataset(
                ravdess_root=root,
                output_manifest_path=root / "test_manifest.json",
                output_stats_path=root / "test_statistics.json",
                extract_if_needed=False,
                strict_official_counts=False
            )
        assert "lacks a matching full-AV video" in str(exc_info.value)


def test_ravdess_official_archives_fast_integrity_check():
    """
    If the official archives are present in ~/Downloads, verifies:
      - Exactly 1,440 speech audio trials in Audio_Speech_Actors_01-24.zip
      - Exactly 192 calm trials
      - Exactly 1,248 eligible trials
      - Exactly 24 video archives
      - Exactly 100% full-AV video pairing across all 1,248 eligible audio trials
    """
    audio_archive, video_archives = locate_ravdess_archives()
    if not audio_archive or len(video_archives) != 24:
        pytest.skip("Official RAVDESS zip archives not found in standard download paths.")

    # 1. Inspect Audio Archive
    with zipfile.ZipFile(audio_archive, "r") as za:
        audio_wavs = [f for f in za.namelist() if f.endswith(".wav")]

    speech_audio = []
    calm_audio = []
    for f in audio_wavs:
        fname = Path(f).name
        meta = parse_ravdess_filename(fname)
        if meta.is_speech:
            speech_audio.append(meta)
            if meta.is_calm:
                calm_audio.append(meta)

    assert len(speech_audio) == RAVDESS_OFFICIAL_COUNTS["total_speech_audio"] == 1440
    assert len(calm_audio) == RAVDESS_OFFICIAL_COUNTS["excluded_calm"] == 192
    eligible = [m for m in speech_audio if not m.is_calm]
    assert len(eligible) == RAVDESS_OFFICIAL_COUNTS["eligible_trials"] == 1248

    # 2. Inspect Video Archives
    full_av_videos = set()
    for vz in video_archives:
        with zipfile.ZipFile(vz, "r") as zv:
            for f in zv.namelist():
                fname = Path(f).name
                if fname.startswith("01-") and fname.endswith(".mp4"):
                    full_av_videos.add(fname)

    # 3. Check every eligible audio trial has a matching full-AV video
    missing_videos = []
    for meta in eligible:
        expected_video = meta.canonical_full_av_video_filename
        if expected_video not in full_av_videos:
            missing_videos.append(expected_video)

    assert len(missing_videos) == 0, f"Missing matching full-AV videos: {missing_videos[:5]}"
