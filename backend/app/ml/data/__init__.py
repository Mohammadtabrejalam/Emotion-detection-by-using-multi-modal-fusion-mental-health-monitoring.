"""
MindSense Machine Learning Data Subsystem
Provides validated datasets, manifests, preprocessing, label normalization, and data loaders.
"""

from .label_mapping import (
    normalize_label,
    get_label_id,
    get_label_name,
    STANDARD_EMOTIONS,
    LABEL_TO_ID,
    ID_TO_LABEL,
    MAPPING_VERSION,
    LabelMappingResult
)
from .splits import partition_dataset_by_speaker, validate_split_isolation
from .manifest import SampleRecord, DatasetManifest
from .preprocessing import DatasetPreprocessor
from .dataset import MultimodalEmotionDataset, multimodal_collate_fn

__all__ = [
    "normalize_label",
    "get_label_id",
    "get_label_name",
    "STANDARD_EMOTIONS",
    "LABEL_TO_ID",
    "ID_TO_LABEL",
    "MAPPING_VERSION",
    "LabelMappingResult",
    "partition_dataset_by_speaker",
    "validate_split_isolation",
    "SampleRecord",
    "DatasetManifest",
    "DatasetPreprocessor",
    "MultimodalEmotionDataset",
    "multimodal_collate_fn",
]
