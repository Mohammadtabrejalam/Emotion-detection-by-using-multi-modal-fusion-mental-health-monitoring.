"""
PyTorch Multimodal Dataset & Collate Implementation — MindSense
"""

from pathlib import Path
from typing import Union, List, Dict, Any, Optional
import torch
from torch.utils.data import Dataset

from .manifest import DatasetManifest, SampleRecord
from .preprocessing import DatasetPreprocessor


class MultimodalEmotionDataset(Dataset):
    """
    Validated PyTorch Dataset for multimodal emotion classification.
    Produces strictly aligned multimodal triples with explicit modality masking
    and full metadata provenance.
    """

    def __init__(
        self,
        manifest_or_path: Union[DatasetManifest, List[SampleRecord], str, Path],
        split: Optional[str] = None,
        preprocessor: Optional[DatasetPreprocessor] = None
    ):
        if isinstance(manifest_or_path, DatasetManifest):
            self.manifest = manifest_or_path
        elif isinstance(manifest_or_path, list):
            self.manifest = DatasetManifest(manifest_or_path)
        else:
            self.manifest = DatasetManifest.load_json(manifest_or_path)

        if split is not None:
            self.records = self.manifest.filter_by_split(split)
        else:
            self.records = self.manifest.records

        self.preprocessor = preprocessor or DatasetPreprocessor()

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        record = self.records[idx]

        # 1. Process Text
        text_tensor, text_avail = self.preprocessor.process_text(record.text_content)
        if not record.has_text:
            text_avail = False

        # 2. Process Audio
        audio_tensor, audio_avail = self.preprocessor.process_audio(record.audio_path)
        if not record.has_audio:
            audio_avail = False

        # 3. Process Vision
        vision_tensor, vision_avail = self.preprocessor.process_vision(record.video_path)
        if not record.has_vision:
            vision_avail = False

        # 4. Modality Presence Mask: [Text, Audio, Vision]
        modality_mask = torch.tensor([
            1.0 if text_avail else 0.0,
            1.0 if audio_avail else 0.0,
            1.0 if vision_avail else 0.0
        ], dtype=torch.float32)

        # 5. Label Tensor
        label_tensor = torch.tensor(record.label_id, dtype=torch.long)

        return {
            "sample_id": record.sample_id,
            "text": text_tensor,
            "audio": audio_tensor,
            "vision": vision_tensor,
            "label": label_tensor,
            "speaker_id": record.speaker_id,
            "dataset": record.dataset,
            "modality_mask": modality_mask,
            "metadata": {
                "session_id": record.session_id,
                "utterance_id": record.utterance_id,
                "split": record.split,
                "original_label": record.original_label,
                "duration_sec": record.duration_sec,
                "quality_status": record.quality_status
            }
        }


def multimodal_collate_fn(batch: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Batches variable multimodal dictionary items into aligned PyTorch tensors.

    Returns:
        Dict with batched tensors:
            - "text": (batch_size, 64) torch.long
            - "audio": (batch_size, 200, 13) torch.float32
            - "vision": (batch_size, 1, 48, 48) torch.float32
            - "label": (batch_size,) torch.long
            - "modality_mask": (batch_size, 3) torch.float32
            - "sample_ids": List[str]
            - "speaker_ids": List[str]
            - "datasets": List[str]
            - "metadata": List[Dict[str, Any]]
    """
    sample_ids = [item["sample_id"] for item in batch]
    speaker_ids = [item["speaker_id"] for item in batch]
    datasets = [item["dataset"] for item in batch]
    metadata = [item["metadata"] for item in batch]

    text_tensors = torch.stack([item["text"] for item in batch], dim=0)
    audio_tensors = torch.stack([item["audio"] for item in batch], dim=0)
    vision_tensors = torch.stack([item["vision"] for item in batch], dim=0)
    label_tensors = torch.stack([item["label"] for item in batch], dim=0)
    mask_tensors = torch.stack([item["modality_mask"] for item in batch], dim=0)

    return {
        "sample_ids": sample_ids,
        "speaker_ids": speaker_ids,
        "datasets": datasets,
        "text": text_tensors,
        "audio": audio_tensors,
        "vision": vision_tensors,
        "label": label_tensors,
        "modality_mask": mask_tensors,
        "metadata": metadata
    }
