"""
Unit & Integration Tests: Multimodal Concatenation Fusion Baseline — MindSense Phase 7 Step 1
"""

import tempfile
import hashlib
from pathlib import Path
import pytest
import torch
import torch.nn as nn

from backend.app.ml.fusion.concat_model import MultimodalConcatenationFusion
from backend.app.ml.fusion.config import (
    PRETRAINED_CHECKPOINTS, NUM_CLASSES, D_MODEL, set_seed
)
from backend.app.ml.fusion.train_concat import run_concat_training
from backend.app.ml.data.manifest import SampleRecord, DatasetManifest
from backend.app.ml.data.label_mapping import LABEL_TO_ID, ID_TO_LABEL, STANDARD_EMOTIONS


@pytest.fixture
def concat_model():
    set_seed(42)
    model = MultimodalConcatenationFusion(num_classes=NUM_CLASSES, d_model=D_MODEL)
    model.freeze_backbones()
    return model


@pytest.fixture
def dummy_batch():
    batch_size = 4
    text = torch.randint(0, 1000, (batch_size, 64))
    audio = torch.randn(batch_size, 200, 13)
    vision = torch.randn(batch_size, 1, 48, 48)
    mask = torch.ones((batch_size, 3), dtype=torch.float32)
    labels = torch.randint(0, NUM_CLASSES, (batch_size,))
    return {"text": text, "audio": audio, "vision": vision, "mask": mask, "labels": labels}


# 1. Forward Pass Output Shapes
def test_concat_model_forward_shapes(concat_model, dummy_batch):
    outputs = concat_model(
        text=dummy_batch["text"],
        audio=dummy_batch["audio"],
        vision=dummy_batch["vision"],
        modality_mask=dummy_batch["mask"]
    )
    assert outputs["logits"].shape == (4, NUM_CLASSES)
    assert outputs["multimodal_logits"].shape == (4, NUM_CLASSES)
    assert outputs["concat_embedding"].shape == (4, 192)
    assert outputs["pooled_embedding"].shape == (4, D_MODEL)
    assert outputs["text_logits"].shape == (4, NUM_CLASSES)
    assert outputs["audio_logits"].shape == (4, NUM_CLASSES)
    assert outputs["vision_logits"].shape == (4, NUM_CLASSES)
    assert not torch.isnan(outputs["logits"]).any()


# 2. Exact Parameter Counts
def test_concat_parameter_counts(concat_model):
    params = concat_model.get_parameter_counts()
    # Exact counts determined by audit
    assert params["trainable"] == 14663
    assert params["frozen"] == 183701
    assert params["total"] == 198364
    assert params["projection"] == 12352  # 192 * 64 + 64
    assert params["classifier"] == 2311   # (64 * 32 + 32) + (32 * 7 + 7)


# 3. Frozen Backbone Behavior & Gradient Flow
def test_concat_frozen_backbone_behavior(concat_model, dummy_batch):
    for p in concat_model.text_encoder.parameters():
        assert not p.requires_grad
    for p in concat_model.audio_encoder.parameters():
        assert not p.requires_grad
    for p in concat_model.vision_encoder.parameters():
        assert not p.requires_grad

    assert concat_model.projection.weight.requires_grad
    assert concat_model.projection.bias.requires_grad
    for p in concat_model.classifier.parameters():
        assert p.requires_grad

    # Backpropagation test
    outputs = concat_model(
        text=dummy_batch["text"],
        audio=dummy_batch["audio"],
        vision=dummy_batch["vision"],
        modality_mask=dummy_batch["mask"]
    )
    loss = nn.CrossEntropyLoss()(outputs["logits"], dummy_batch["labels"])
    loss.backward()

    # Backbones must receive zero gradients
    for p in concat_model.text_encoder.parameters():
        assert p.grad is None
    for p in concat_model.audio_encoder.parameters():
        assert p.grad is None
    for p in concat_model.vision_encoder.parameters():
        assert p.grad is None

    # Projection and classifier must receive gradients
    assert concat_model.projection.weight.grad is not None
    assert concat_model.classifier[0].weight.grad is not None


# 4. Modality Masking Isolation
def test_concat_modality_masking(concat_model):
    concat_model.eval()
    batch_size = 2
    text = torch.randint(0, 1000, (batch_size, 64))
    audio1 = torch.randn(batch_size, 200, 13)
    audio2 = torch.randn(batch_size, 200, 13)  # Different audio
    vision = torch.randn(batch_size, 1, 48, 48)

    # Audio is masked: [1, 0, 1]
    mask = torch.tensor([[1.0, 0.0, 1.0]] * batch_size)

    with torch.no_grad():
        out1 = concat_model(text=text, audio=audio1, vision=vision, modality_mask=mask)
        out2 = concat_model(text=text, audio=audio2, vision=vision, modality_mask=mask)

    # Changing masked audio must NOT alter concatenated representation or logits
    assert torch.allclose(out1["concat_embedding"], out2["concat_embedding"], atol=1e-5)
    assert torch.allclose(out1["logits"], out2["logits"], atol=1e-5)


# 5. Canonical Label Mapping Integrity
def test_canonical_label_mapping_integrity():
    expected = {
        "happy": 0,
        "sad": 1,
        "angry": 2,
        "fear": 3,
        "surprise": 4,
        "disgust": 5,
        "neutral": 6
    }
    for emo, expected_id in expected.items():
        assert LABEL_TO_ID[emo] == expected_id
        assert ID_TO_LABEL[expected_id] == emo
        assert STANDARD_EMOTIONS[expected_id] == emo


# 6. E04 Checkpoint Integrity & Hash Verification
def test_e04_checkpoint_integrity():
    from backend.app.ml.fusion.config import REPO_ROOT
    e04_path = REPO_ROOT / "artifacts" / "E04_Multimodal_Fusion_Frozen" / "best_model.pt"
    assert e04_path.exists(), f"E04 checkpoint missing: {e04_path}"

    hasher = hashlib.sha256()
    with open(e04_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    digest = hasher.hexdigest()

    expected_sha256 = "8fef75fa4315183ccb69e7cf62d4b92c586473cfccbaf6f074810ae0abe7f49b"
    assert digest == expected_sha256, f"E04 checkpoint hash changed! Expected {expected_sha256}, got {digest}"


# 7. Training Loop Dry-Run & Test Leakage Verification
def test_concat_training_dry_run_and_no_test_leakage():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        manifest_path = tmp_path / "manifest.json"

        # Synthetic records
        records = [
            SampleRecord(
                sample_id=f"train_{i}", dataset="meld", speaker_id="spk1", session_id="s1",
                utterance_id=f"u{i}", text_content=f"Sample text utterance {i}",
                has_text=True, has_audio=False, has_vision=False,
                label="happy", label_id=0, original_label="joy", label_source="test",
                split="train", quality_status="valid"
            )
            for i in range(4)
        ] + [
            SampleRecord(
                sample_id=f"val_{i}", dataset="meld", speaker_id="spk1", session_id="s1",
                utterance_id=f"uv{i}", text_content=f"Val sample text {i}",
                has_text=True, has_audio=False, has_vision=False,
                label="sad", label_id=1, original_label="sadness", label_source="test",
                split="val", quality_status="valid"
            )
            for i in range(2)
        ] + [
            SampleRecord(
                sample_id=f"test_{i}", dataset="meld", speaker_id="spk2", session_id="s2",
                utterance_id=f"ut{i}", text_content=f"Test sample {i}",
                has_text=True, has_audio=False, has_vision=False,
                label="angry", label_id=2, original_label="anger", label_source="test",
                split="test", quality_status="valid"
            )
            for i in range(2)
        ]

        DatasetManifest(records).save_json(manifest_path)
        out_dir = tmp_path / "artifacts"

        cfg = run_concat_training(
            manifest_path=manifest_path,
            epochs=1,
            batch_size=2,
            freeze_backbones=True,
            output_dir=out_dir
        )

        assert cfg["epochs_trained"] == 1
        assert (out_dir / "checkpoints" / "best_model.pt").exists()
        assert (out_dir / "config.json").exists()
        assert (out_dir / "training_history.json").exists()
        # Test split must NOT be evaluated or created in output directory
        assert not (out_dir / "metrics" / "metrics.json").exists()
