"""
PyTorch Multimodal Dataset & DataLoader Pipeline Tests — MindSense
"""

import pytest
import torch
from torch.utils.data import DataLoader
from backend.app.ml.data.manifest import SampleRecord, DatasetManifest
from backend.app.ml.data.dataset import MultimodalEmotionDataset, multimodal_collate_fn
from backend.app.ml.data.preprocessing import DatasetPreprocessor


@pytest.fixture
def mock_manifest_records():
    return [
        SampleRecord(
            sample_id="rec_mock_001",
            dataset="meld",
            speaker_id="speaker_rachel",
            session_id="dia01",
            utterance_id="utt01",
            text_content="I am so incredibly happy today!",
            has_text=True,
            has_audio=False,  # Unset audio
            has_vision=False, # Unset vision
            label="happy",
            label_id=0,
            original_label="joy",
            label_source="test",
            split="train",
            quality_status="valid",
            audio_path=None,
            video_path=None
        ),
        SampleRecord(
            sample_id="rec_mock_002",
            dataset="meld",
            speaker_id="speaker_ross",
            session_id="dia01",
            utterance_id="utt02",
            text_content="This is terrible and sad.",
            has_text=True,
            has_audio=False,
            has_vision=False,
            label="sad",
            label_id=1,
            original_label="sadness",
            label_source="test",
            split="train",
            quality_status="valid",
            audio_path=None,
            video_path=None
        ),
        SampleRecord(
            sample_id="rec_mock_003",
            dataset="meld",
            speaker_id="speaker_chandler",
            session_id="dia02",
            utterance_id="utt01",
            text_content="Could this be any more neutral?",
            has_text=True,
            has_audio=False,
            has_vision=False,
            label="neutral",
            label_id=6,
            original_label="neutral",
            label_source="test",
            split="test",
            quality_status="valid",
            audio_path=None,
            video_path=None
        )
    ]


def test_dataset_item_structure_and_mask(mock_manifest_records):
    manifest = DatasetManifest(mock_manifest_records)
    dataset = MultimodalEmotionDataset(manifest, split="train")

    assert len(dataset) == 2
    item = dataset[0]

    assert "sample_id" in item
    assert "text" in item
    assert "audio" in item
    assert "vision" in item
    assert "label" in item
    assert "modality_mask" in item

    # Tensor shape contracts
    assert item["text"].shape == (64,)
    assert item["text"].dtype == torch.long
    assert item["audio"].shape == (200, 13)
    assert item["audio"].dtype == torch.float32
    assert item["vision"].shape == (1, 48, 48)
    assert item["vision"].dtype == torch.float32
    assert item["label"].item() == 0

    # Mask should indicate text present (1.0) and audio/vision absent (0.0)
    expected_mask = torch.tensor([1.0, 0.0, 0.0])
    assert torch.equal(item["modality_mask"], expected_mask)


def test_experimental_ablation_masking(mock_manifest_records):
    manifest = DatasetManifest(mock_manifest_records)
    # Mask text experimentally
    dataset_masked = MultimodalEmotionDataset(manifest, split="train", masked_modalities=["text"])

    item = dataset_masked[0]
    expected_mask = torch.tensor([0.0, 0.0, 0.0])
    assert torch.equal(item["modality_mask"], expected_mask)


def test_dataloader_collate_shapes(mock_manifest_records):
    manifest = DatasetManifest(mock_manifest_records)
    dataset = MultimodalEmotionDataset(manifest)
    loader = DataLoader(dataset, batch_size=3, shuffle=False, collate_fn=multimodal_collate_fn)

    batch = next(iter(loader))

    assert batch["text"].shape == (3, 64)
    assert batch["audio"].shape == (3, 200, 13)
    assert batch["vision"].shape == (3, 1, 48, 48)
    assert batch["label"].shape == (3,)
    assert batch["modality_mask"].shape == (3, 3)
    assert len(batch["sample_ids"]) == 3
    assert len(batch["speaker_ids"]) == 3


def test_preprocessor_strict_vs_lenient_paths():
    # Lenient mode returns zero tensor without crashing
    lenient_prep = DatasetPreprocessor(strict_paths=False)
    audio_tensor, avail = lenient_prep.process_audio("non_existent_file.wav")
    assert avail is False
    assert audio_tensor.shape == (200, 13)

    # Strict mode raises FileNotFoundError for missing dataset path
    strict_prep = DatasetPreprocessor(strict_paths=True)
    with pytest.raises(FileNotFoundError):
        strict_prep.process_audio("non_existent_file.wav")
