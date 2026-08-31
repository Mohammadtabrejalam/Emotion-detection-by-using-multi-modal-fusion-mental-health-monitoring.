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
    filter_valid_unimodal_records, compute_class_weights_from_train
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
