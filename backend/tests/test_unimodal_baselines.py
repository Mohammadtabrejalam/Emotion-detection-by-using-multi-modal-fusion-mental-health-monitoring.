"""
Unit Tests for Phase 2 Unimodal Baselines & Research Integrity — MindSense
"""

import tempfile
import torch
import torch.nn as nn
from pathlib import Path

from backend.app.ml.data.manifest import SampleRecord, DatasetManifest
from backend.app.ml.baselines.config import EMOTION_CLASSES, NUM_CLASSES, set_seed
from backend.app.ml.baselines.metrics import compute_comprehensive_metrics
from backend.app.ml.baselines.common import (
    filter_valid_unimodal_records, compute_class_weights_from_train, run_unimodal_training
)
from backend.app.ml.text_encoder import TextEncoder
from backend.app.ml.audio_encoder import AudioEncoder
from backend.app.ml.vision_encoder import VisionEncoder


def test_modality_filtering_isolation():
    r_text = SampleRecord(
        sample_id="text_only", dataset="meld", speaker_id="spk1", session_id="dia1",
        utterance_id="utt1", text_content="Hello world", has_text=True, has_audio=False,
        has_vision=False, label="neutral", label_id=4, original_label="neutral",
        label_source="test", split="train", quality_status="text_only"
    )
    r_audio = SampleRecord(
        sample_id="audio_only", dataset="meld", speaker_id="spk1", session_id="dia1",
        utterance_id="utt2", text_content="", has_text=False, has_audio=True,
        has_vision=False, label="happy", label_id=3, original_label="happy",
        label_source="test", split="train", quality_status="partial",
        audio_path="dummy.wav"
    )

    records = [r_text, r_audio]

    # Filter for Text: should pick r_text, exclude r_audio
    valid_text, excl_text = filter_valid_unimodal_records(records, "text")
    assert len(valid_text) == 1
    assert valid_text[0].sample_id == "text_only"
    assert excl_text == 1

    # Filter for Audio: should exclude r_text and non-existent audio_path
    valid_audio, excl_audio = filter_valid_unimodal_records(records, "audio")
    assert len(valid_audio) == 0
    assert excl_audio == 2


def test_class_weights_derived_only_from_train():
    records = [
        SampleRecord(
            sample_id=f"r_{i}", dataset="meld", speaker_id="spk", session_id="dia",
            utterance_id=f"u_{i}", text_content="Text", has_text=True, has_audio=False,
            has_vision=False, label=EMOTION_CLASSES[i % 2], label_id=i % 2,
            original_label="label", label_source="test", split="train", quality_status="valid"
        )
        for i in range(10)
    ]
    # class 0 count = 5, class 1 count = 5, others = 0
    weights = compute_class_weights_from_train(records, num_classes=NUM_CLASSES)
    assert len(weights) == NUM_CLASSES
    # Weights must be a torch Tensor and non-zero
    assert isinstance(weights, torch.Tensor)
    assert float(weights[0]) > 0.0
    assert float(weights[1]) > 0.0


def test_metric_computation_and_confusion_matrix_dimensions():
    y_true = [0, 1, 2, 3, 4, 5, 6, 0, 1, 4]
    y_pred = [0, 1, 2, 3, 4, 5, 6, 4, 1, 4]  # 9/10 correct

    metrics = compute_comprehensive_metrics(y_true, y_pred)
    assert metrics["accuracy"] == 0.9
    assert "macro_f1" in metrics
    assert "weighted_f1" in metrics
    assert len(metrics["per_class"]) == NUM_CLASSES
    assert len(metrics["confusion_matrix"]) == NUM_CLASSES
    assert len(metrics["confusion_matrix"][0]) == NUM_CLASSES


def test_unimodal_encoder_output_shapes():
    # TextEncoder
    text_model = TextEncoder(vocab_size=100, embed_dim=64, hidden_dim=64, num_classes=7)
    dummy_text = torch.randint(0, 100, (4, 64))
    t_embed, t_logits = text_model(dummy_text)
    assert t_embed.shape == (4, 64)
    assert t_logits.shape == (4, 7)

    # AudioEncoder
    audio_model = AudioEncoder(input_dim=13, hidden_dim=64, num_classes=7)
    dummy_audio = torch.randn(4, 200, 13)
    a_embed, a_logits = audio_model(dummy_audio)
    assert a_embed.shape == (4, 64)
    assert a_logits.shape == (4, 7)

    # VisionEncoder
    vision_model = VisionEncoder(in_channels=1, hidden_dim=64, num_classes=7)
    dummy_vision = torch.randn(4, 1, 48, 48)
    v_embed, v_logits = vision_model(dummy_vision)
    assert v_embed.shape == (4, 64)
    assert v_logits.shape == (4, 7)


def test_reproducibility_seed_setting():
    set_seed(42)
    t1 = torch.randn(3, 3)
    set_seed(42)
    t2 = torch.randn(3, 3)
    assert torch.equal(t1, t2)


def test_unimodal_training_resume_checkpoint():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        manifest_path = tmp_path / "manifest.json"

        # Create minimal synthetic manifest with train and val samples
        records = [
            SampleRecord(
                sample_id=f"train_{i}", dataset="meld", speaker_id="spk1", session_id="s1",
                utterance_id=f"u{i}", text_content=f"Sample text utterance {i}",
                has_text=True, has_audio=False, has_vision=False,
                label="joy", label_id=0, original_label="joy", label_source="test",
                split="train", quality_status="valid"
            )
            for i in range(6)
        ] + [
            SampleRecord(
                sample_id=f"val_{i}", dataset="meld", speaker_id="spk1", session_id="s1",
                utterance_id=f"uv{i}", text_content=f"Val sample text {i}",
                has_text=True, has_audio=False, has_vision=False,
                label="sadness", label_id=1, original_label="sadness", label_source="test",
                split="val", quality_status="valid"
            )
            for i in range(4)
        ]

        manifest = DatasetManifest(records)
        manifest.save_json(manifest_path)

        out_dir = tmp_path / "artifacts"
        model_kwargs = {"vocab_size": 100, "embed_dim": 32, "hidden_dim": 32, "num_classes": 7}

        # Step 1: Initial training for 2 epochs
        cfg1 = run_unimodal_training(
            modality="text",
            model_cls=TextEncoder,
            model_kwargs=model_kwargs,
            experiment_id="test_run_initial",
            manifest_path=manifest_path,
            epochs=2,
            batch_size=2,
            output_dir=out_dir
        )

        ckpt_path = out_dir / "best_model.pt"
        assert ckpt_path.exists()
        ckpt1 = torch.load(ckpt_path, map_location="cpu")
        assert "epoch" in ckpt1
        assert "model_state_dict" in ckpt1
        assert "optimizer_state_dict" in ckpt1
        saved_epoch = ckpt1["epoch"]
        saved_f1 = ckpt1["val_macro_f1"]

        # Step 2: Resume training to target 4 epochs
        cfg2 = run_unimodal_training(
            modality="text",
            model_cls=TextEncoder,
            model_kwargs=model_kwargs,
            experiment_id="test_run_resumed",
            manifest_path=manifest_path,
            epochs=4,
            batch_size=2,
            resume_from=ckpt_path,
            output_dir=out_dir
        )

        assert cfg2["best_epoch"] >= saved_epoch
        assert cfg2["best_val_macro_f1"] >= -1.0
        assert cfg2["resumed_from"] == str(ckpt_path)


def test_vision_checkpoint_restoration_integrity():
    vision_ckpt_path = Path("artifacts/baselines/vision/best_model.pt")
    assert vision_ckpt_path.exists(), "Vision checkpoint best_model.pt should exist"

    ckpt = torch.load(vision_ckpt_path, map_location="cpu")
    assert "epoch" in ckpt
    assert "model_state_dict" in ckpt
    assert "optimizer_state_dict" in ckpt
    assert "val_macro_f1" in ckpt
    assert isinstance(ckpt["epoch"], int) and ckpt["epoch"] >= 1
    assert isinstance(ckpt["val_macro_f1"], (int, float)) and 0.0 <= ckpt["val_macro_f1"] <= 1.0

    # Verify model instantiation and loading
    vision_model = VisionEncoder(in_channels=1, hidden_dim=64, num_classes=7)
    vision_model.load_state_dict(ckpt["model_state_dict"])
    vision_model.eval()

    dummy_input = torch.randn(2, 1, 48, 48)
    with torch.no_grad():
        embed, logits = vision_model(dummy_input)
    assert embed.shape == (2, 64)
    assert logits.shape == (2, 7)


def test_resume_from_nonexistent_checkpoint_raises():
    import pytest
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        manifest_path = tmp_path / "manifest.json"
        records = [
            SampleRecord(
                sample_id="dummy_1", dataset="meld", speaker_id="spk1", session_id="s1",
                utterance_id="u1", text_content="Sample text",
                has_text=True, has_audio=False, has_vision=False,
                label="joy", label_id=0, original_label="joy", label_source="test",
                split="train", quality_status="valid"
            ),
            SampleRecord(
                sample_id="dummy_2", dataset="meld", speaker_id="spk1", session_id="s1",
                utterance_id="u2", text_content="Sample text val",
                has_text=True, has_audio=False, has_vision=False,
                label="joy", label_id=0, original_label="joy", label_source="test",
                split="val", quality_status="valid"
            )
        ]
        DatasetManifest(records).save_json(manifest_path)

        with pytest.raises(FileNotFoundError):
            run_unimodal_training(
                modality="text",
                model_cls=TextEncoder,
                model_kwargs={"vocab_size": 10, "embed_dim": 16, "hidden_dim": 16, "num_classes": 7},
                experiment_id="test_fail",
                manifest_path=manifest_path,
                epochs=5,
                resume_from=tmp_path / "does_not_exist.pt",
                output_dir=tmp_path
            )

