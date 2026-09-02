"""
Unit & Integration Tests: Phase 3 Multimodal Fusion Transformer — MindSense
"""

import tempfile
from pathlib import Path
import pytest
import torch
import torch.nn as nn

from backend.app.ml.fusion.model import MultimodalFusionTransformer
from backend.app.ml.fusion.config import (
    PRETRAINED_CHECKPOINTS, ABLATION_CONFIGS, NUM_CLASSES, D_MODEL, NHEAD, set_seed
)
from backend.app.ml.fusion.train import run_fusion_training
from backend.app.ml.fusion.evaluate import evaluate_fusion_model
from backend.app.ml.fusion.ablation import run_ablation_study
from backend.app.ml.data.manifest import SampleRecord, DatasetManifest
from backend.app.ml.baselines.metrics import compute_comprehensive_metrics


@pytest.fixture
def fusion_model():
    set_seed(42)
    return MultimodalFusionTransformer(num_classes=NUM_CLASSES, d_model=D_MODEL, nhead=NHEAD)


@pytest.fixture
def dummy_batch():
    batch_size = 4
    text = torch.randint(0, 1000, (batch_size, 64))
    audio = torch.randn(batch_size, 200, 13)
    vision = torch.randn(batch_size, 1, 48, 48)
    mask = torch.ones((batch_size, 3), dtype=torch.float32)
    labels = torch.randint(0, NUM_CLASSES, (batch_size,))
    return {"text": text, "audio": audio, "vision": vision, "mask": mask, "labels": labels}


# 1. Forward-Pass Shapes
def test_forward_pass_output_shapes(fusion_model, dummy_batch):
    outputs = fusion_model(
        text=dummy_batch["text"],
        audio=dummy_batch["audio"],
        vision=dummy_batch["vision"],
        modality_mask=dummy_batch["mask"]
    )
    assert outputs["logits"].shape == (4, NUM_CLASSES)
    assert outputs["multimodal_logits"].shape == (4, NUM_CLASSES)
    assert outputs["pooled_embedding"].shape == (4, D_MODEL)
    assert outputs["attention_weights"].shape == (4, 3, 3)
    assert outputs["text_logits"].shape == (4, NUM_CLASSES)
    assert outputs["audio_logits"].shape == (4, NUM_CLASSES)
    assert outputs["vision_logits"].shape == (4, NUM_CLASSES)
    assert not torch.isnan(outputs["logits"]).any()


# 2. Three-Modality Fusion (Full)
def test_three_modality_fusion(fusion_model, dummy_batch):
    outputs = fusion_model(
        text=dummy_batch["text"],
        audio=dummy_batch["audio"],
        vision=dummy_batch["vision"],
        modality_mask=dummy_batch["mask"]
    )
    assert outputs["logits"].shape == (4, NUM_CLASSES)
    # Check that pooled embedding is non-zero
    assert (outputs["pooled_embedding"] != 0).any()


# 3. Single-Modality Masking (Pairwise Active: T+A, T+V, A+V)
def test_single_modality_masking(fusion_model, dummy_batch):
    # T+A (Vision masked: [1, 1, 0])
    mask_ta = torch.tensor([[1.0, 1.0, 0.0]] * 4)
    out_ta = fusion_model(
        text=dummy_batch["text"],
        audio=dummy_batch["audio"],
        vision=dummy_batch["vision"],
        modality_mask=mask_ta
    )
    assert out_ta["logits"].shape == (4, NUM_CLASSES)
    assert not torch.isnan(out_ta["logits"]).any()

    # T+V (Audio masked: [1, 0, 1])
    mask_tv = torch.tensor([[1.0, 0.0, 1.0]] * 4)
    out_tv = fusion_model(
        text=dummy_batch["text"],
        audio=dummy_batch["audio"],
        vision=dummy_batch["vision"],
        modality_mask=mask_tv
    )
    assert out_tv["logits"].shape == (4, NUM_CLASSES)
    assert not torch.isnan(out_tv["logits"]).any()

    # A+V (Text masked: [0, 1, 1])
    mask_av = torch.tensor([[0.0, 1.0, 1.0]] * 4)
    out_av = fusion_model(
        text=dummy_batch["text"],
        audio=dummy_batch["audio"],
        vision=dummy_batch["vision"],
        modality_mask=mask_av
    )
    assert out_av["logits"].shape == (4, NUM_CLASSES)
    assert not torch.isnan(out_av["logits"]).any()


# 4. Pairwise Masking (Unimodal Active: T only, A only, V only)
def test_pairwise_masking_unimodal(fusion_model, dummy_batch):
    for idx, name in enumerate(["Text only", "Audio only", "Vision only"]):
        mask = torch.zeros((4, 3))
        mask[:, idx] = 1.0
        out = fusion_model(
            text=dummy_batch["text"],
            audio=dummy_batch["audio"],
            vision=dummy_batch["vision"],
            modality_mask=mask
        )
        assert out["logits"].shape == (4, NUM_CLASSES)
        assert not torch.isnan(out["logits"]).any()


# 5. All-Modality Masking Behavior
def test_all_modality_masking_behavior(fusion_model, dummy_batch):
    mask_none = torch.zeros((4, 3))
    out = fusion_model(
        text=dummy_batch["text"],
        audio=dummy_batch["audio"],
        vision=dummy_batch["vision"],
        modality_mask=mask_none
    )
    assert out["logits"].shape == (4, NUM_CLASSES)
    assert not torch.isnan(out["logits"]).any()
    # Pooled vector should be zero for completely masked input
    assert torch.equal(out["pooled_embedding"], torch.zeros(4, D_MODEL))


# 6. Attention Key-Padding Isolation (Masked inputs do not affect active output)
def test_attention_key_padding_isolation(fusion_model):
    fusion_model.eval()
    batch_size = 2
    text = torch.randint(0, 1000, (batch_size, 64))
    audio1 = torch.randn(batch_size, 200, 13)
    audio2 = torch.randn(batch_size, 200, 13)  # Different audio
    vision = torch.randn(batch_size, 1, 48, 48)

    # Audio is masked: [1, 0, 1]
    mask = torch.tensor([[1.0, 0.0, 1.0]] * batch_size)

    with torch.no_grad():
        out1 = fusion_model(text=text, audio=audio1, vision=vision, modality_mask=mask)
        out2 = fusion_model(text=text, audio=audio2, vision=vision, modality_mask=mask)

    # Changing masked audio must NOT alter pooled representation or logits
    assert torch.allclose(out1["pooled_embedding"], out2["pooled_embedding"], atol=1e-5)
    assert torch.allclose(out1["logits"], out2["logits"], atol=1e-5)


# 7. Pretrained Checkpoint Loading
def test_pretrained_checkpoint_loading(fusion_model):
    status = fusion_model.load_pretrained_backbones(
        checkpoint_paths=PRETRAINED_CHECKPOINTS,
        freeze=True
    )
    assert status["text"] is True
    assert status["audio"] is True
    assert status["vision"] is True


# 8. Frozen Backbone Behavior
def test_frozen_backbone_behavior(fusion_model, dummy_batch):
    fusion_model.freeze_backbones()

    for p in fusion_model.text_encoder.parameters():
        assert not p.requires_grad
    for p in fusion_model.audio_encoder.parameters():
        assert not p.requires_grad
    for p in fusion_model.vision_encoder.parameters():
        assert not p.requires_grad

    # Attention and classifier must remain trainable
    for p in fusion_model.attention.parameters():
        assert p.requires_grad
    for p in fusion_model.classifier.parameters():
        assert p.requires_grad

    # Backpropagation check
    out = fusion_model(
        text=dummy_batch["text"],
        audio=dummy_batch["audio"],
        vision=dummy_batch["vision"],
        modality_mask=dummy_batch["mask"]
    )
    loss = nn.CrossEntropyLoss()(out["logits"], dummy_batch["labels"])
    loss.backward()

    # Backbone parameters should have no gradients
    for p in fusion_model.text_encoder.parameters():
        assert p.grad is None
    for p in fusion_model.audio_encoder.parameters():
        assert p.grad is None
    for p in fusion_model.vision_encoder.parameters():
        assert p.grad is None

    # Attention & Classifier must have gradients
    assert fusion_model.classifier[0].weight.grad is not None


# 9. Fine-Tuning Behavior
def test_finetuning_backbone_behavior(fusion_model, dummy_batch):
    fusion_model.unfreeze_backbones()

    for p in fusion_model.text_encoder.parameters():
        assert p.requires_grad
    for p in fusion_model.audio_encoder.parameters():
        assert p.requires_grad
    for p in fusion_model.vision_encoder.parameters():
        assert p.requires_grad

    out = fusion_model(
        text=dummy_batch["text"],
        audio=dummy_batch["audio"],
        vision=dummy_batch["vision"],
        modality_mask=dummy_batch["mask"]
    )
    loss = nn.CrossEntropyLoss()(out["logits"], dummy_batch["labels"])
    loss.backward()

    # Backbone feature-projection parameters must receive gradients
    assert fusion_model.text_encoder.fc_embed.weight.grad is not None
    assert fusion_model.audio_encoder.fc_embed.weight.grad is not None
    assert fusion_model.vision_encoder.fc_embed.weight.grad is not None


# 10. Checkpoint Save and Resume
def test_fusion_training_save_and_resume():
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
            for i in range(6)
        ] + [
            SampleRecord(
                sample_id=f"val_{i}", dataset="meld", speaker_id="spk1", session_id="s1",
                utterance_id=f"uv{i}", text_content=f"Val sample text {i}",
                has_text=True, has_audio=False, has_vision=False,
                label="sad", label_id=1, original_label="sadness", label_source="test",
                split="val", quality_status="valid"
            )
            for i in range(4)
        ]

        DatasetManifest(records).save_json(manifest_path)

        out_dir = tmp_path / "artifacts"

        # Stage 1: Run 2 epochs
        cfg1 = run_fusion_training(
            manifest_path=manifest_path,
            epochs=2,
            batch_size=2,
            freeze_backbones=True,
            output_dir=out_dir
        )

        ckpt_path = out_dir / "checkpoints" / "best_model.pt"
        assert ckpt_path.exists()
        ckpt1 = torch.load(ckpt_path, map_location="cpu", weights_only=False)
        assert "epoch" in ckpt1
        assert "model_state_dict" in ckpt1
        saved_epoch = ckpt1["epoch"]

        # Stage 2: Resume to 4 epochs
        cfg2 = run_fusion_training(
            manifest_path=manifest_path,
            epochs=4,
            batch_size=2,
            freeze_backbones=True,
            resume_from=ckpt_path,
            output_dir=out_dir
        )

        assert cfg2["best_epoch"] >= saved_epoch
        assert cfg2["resumed_from"] == str(ckpt_path)


# 11. Seven Ablation Configurations
def test_seven_ablation_configurations():
    assert len(ABLATION_CONFIGS) == 7
    expected_keys = {"T", "A", "V", "T+A", "T+V", "A+V", "T+A+V"}
    assert set(ABLATION_CONFIGS.keys()) == expected_keys

    for code, cfg in ABLATION_CONFIGS.items():
        assert "name" in cfg
        assert "active_modalities" in cfg
        assert "masked_modalities" in cfg
        assert len(cfg["active_modalities"]) + len(cfg["masked_modalities"]) == 3


# 12. Metric Generation
def test_fusion_metric_computation():
    y_true = [0, 1, 2, 3, 4, 5, 6, 0, 1, 4]
    y_pred = [0, 1, 2, 3, 4, 5, 6, 4, 1, 4]

    metrics = compute_comprehensive_metrics(y_true, y_pred)
    assert "accuracy" in metrics
    assert "macro_f1" in metrics
    assert "weighted_f1" in metrics
    assert "macro_precision" in metrics
    assert "macro_recall" in metrics
    assert "confusion_matrix" in metrics
    assert len(metrics["confusion_matrix"]) == NUM_CLASSES


# 13. No Test Leakage
def test_no_test_leakage_during_training():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        manifest_path = tmp_path / "manifest.json"

        # Manifest with train, val, and test splits
        records = [
            SampleRecord(
                sample_id=f"train_{i}", dataset="meld", speaker_id="spk1", session_id="s1",
                utterance_id=f"u{i}", text_content=f"Train sample {i}",
                has_text=True, has_audio=False, has_vision=False,
                label="happy", label_id=0, original_label="joy", label_source="test",
                split="train", quality_status="valid"
            )
            for i in range(4)
        ] + [
            SampleRecord(
                sample_id=f"val_{i}", dataset="meld", speaker_id="spk1", session_id="s1",
                utterance_id=f"uv{i}", text_content=f"Val sample {i}",
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

        manifest = DatasetManifest(records)
        manifest.save_json(manifest_path)

        out_dir = tmp_path / "artifacts"
        cfg = run_fusion_training(
            manifest_path=manifest_path,
            epochs=1,
            batch_size=2,
            freeze_backbones=True,
            output_dir=out_dir
        )

        # Training history should have 1 epoch
        assert cfg["epochs_trained"] == 1
        # Test split was not touched during training
        assert not (out_dir / "metrics" / "metrics.json").exists()


# 14. Regression Test: Corrupted dia125_utt3.mp4 exclusion
def test_corrupted_sample_dia125_utt3_is_rejected():
    from backend.app.ml.baselines.common import filter_valid_multimodal_records
    from backend.app.ml.fusion.config import DATA_MANIFEST_PATH

    # 1. Synthetic corruption test
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_p = Path(tmpdir) / "corrupt.mp4"
        with open(tmp_p, "wb") as f:
            f.write(b"\x00" * 256)

        rec_corrupt = SampleRecord(
            sample_id="meld_corrupt_test", dataset="meld", speaker_id="spk1", session_id="s1",
            utterance_id="u1", text_content="Corrupted sample test",
            has_text=True, has_audio=True, has_vision=True,
            label="neutral", label_id=4, original_label="neutral", label_source="test",
            split="train", quality_status="valid",
            audio_path=str(tmp_p), video_path=str(tmp_p)
        )
        valid, excl = filter_valid_multimodal_records([rec_corrupt])
        assert len(valid) == 0
        assert excl == 1

    # 2. Real MELD dataset manifest validation
    if DATA_MANIFEST_PATH.exists():
        manifest = DatasetManifest.load_json(DATA_MANIFEST_PATH)
        train_raw = manifest.filter_by_split("train")
        val_raw = manifest.filter_by_split("val")

        train_valid, train_excl = filter_valid_multimodal_records(train_raw)
        val_valid, val_excl = filter_valid_multimodal_records(val_raw)

        # dia125_utt3 is excluded from train
        train_ids = {r.sample_id for r in train_valid}
        assert "meld_train_dia125_utt3" not in train_ids
        assert len(train_valid) == 9988
        assert train_excl == 1
        assert len(val_valid) == 1109
        assert val_excl == 0


# 15. Unimodal and Multimodal Validation Consistency
def test_unimodal_and_multimodal_filtering_consistency():
    from backend.app.ml.baselines.common import (
        filter_valid_unimodal_records, filter_valid_multimodal_records
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_bad = Path(tmpdir) / "bad.mp4"
        with open(tmp_bad, "wb") as f:
            f.write(b"\x00" * 256)

        tmp_good = Path(tmpdir) / "good.mp4"
        with open(tmp_good, "wb") as f:
            f.write(b"ftypisom" + b"A" * 256)

        rec_bad = SampleRecord(
            sample_id="bad_1", dataset="meld", speaker_id="spk1", session_id="s1",
            utterance_id="u1", text_content="Valid text",
            has_text=True, has_audio=True, has_vision=True,
            label="neutral", label_id=4, original_label="neutral", label_source="test",
            split="train", quality_status="valid",
            audio_path=str(tmp_bad), video_path=str(tmp_bad)
        )
        rec_good = SampleRecord(
            sample_id="good_1", dataset="meld", speaker_id="spk1", session_id="s1",
            utterance_id="u2", text_content="Valid text",
            has_text=True, has_audio=True, has_vision=True,
            label="happy", label_id=0, original_label="joy", label_source="test",
            split="train", quality_status="valid",
            audio_path=str(tmp_good), video_path=str(tmp_good)
        )

        test_records = [rec_bad, rec_good]

        # Audio unimodal filter
        audio_valid, audio_excl = filter_valid_unimodal_records(test_records, "audio")
        assert len(audio_valid) == 1
        assert audio_valid[0].sample_id == "good_1"
        assert audio_excl == 1

        # Vision unimodal filter
        vision_valid, vision_excl = filter_valid_unimodal_records(test_records, "vision")
        assert len(vision_valid) == 1
        assert vision_valid[0].sample_id == "good_1"
        assert vision_excl == 1

        # Multimodal filter
        multi_valid, multi_excl = filter_valid_multimodal_records(test_records)
        assert len(multi_valid) == 1
        assert multi_valid[0].sample_id == "good_1"
        assert multi_excl == 1

        # filter_valid_unimodal_records with "multimodal"
        multi_via_uni_valid, multi_via_uni_excl = filter_valid_unimodal_records(test_records, "multimodal")
        assert len(multi_via_uni_valid) == 1
        assert multi_via_uni_excl == 1
