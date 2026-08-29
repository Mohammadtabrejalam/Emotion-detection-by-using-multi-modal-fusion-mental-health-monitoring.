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
            sample_id="rec_full_001",
            dataset="meld",
            speaker_id="speaker_rachel",
            session_id="dia01",
            utterance_id="utt01",
            text_content="I am so incredibly happy today!",
            has_text=True,
            has_audio=False,  # Test missing audio
            has_vision=False, # Test missing vision
            label="happy",
            label_id=0,
            original_label="joy",
            label_source="test",
            split="train",
            quality_status="valid"
        ),
        SampleRecord(
            sample_id="rec_full_002",
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
            quality_status="valid"
        ),
        SampleRecord(
            sample_id="rec_full_003",
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
            quality_status="valid"
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


def test_preprocessor_empty_and_corrupt_inputs():
    preprocessor = DatasetPreprocessor()

    # Empty text
    text_tensor, text_avail = preprocessor.process_text("")
    assert text_avail is False
    assert text_tensor.shape == (64,)
    assert torch.all(text_tensor == 0)

    # Non-existent audio
    audio_tensor, audio_avail = preprocessor.process_audio("non_existent_file.wav")
    assert audio_avail is False
    assert audio_tensor.shape == (200, 13)
    assert torch.all(audio_tensor == 0)

    # Non-existent vision
    vision_tensor, vision_avail = preprocessor.process_vision("non_existent_frame.jpg")
    assert vision_avail is False
    assert vision_tensor.shape == (1, 48, 48)
    assert torch.all(vision_tensor == 0)
