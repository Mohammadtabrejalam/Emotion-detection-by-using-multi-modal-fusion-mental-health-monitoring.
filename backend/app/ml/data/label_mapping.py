"""
Label Mapping & Normalization Subsystem — MindSense
Version: 1.0.0

Provides controlled, scientifically justified mapping from raw dataset annotations
to standardized research affective classes while preserving raw labels and rejecting
ambiguous or unmappable classes.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any

MAPPING_VERSION = "1.0.0"

# Standard 7-class discrete emotion taxonomy (Ekman 6 + Neutral)
STANDARD_EMOTIONS = ["happy", "sad", "angry", "fear", "surprise", "disgust", "neutral"]

LABEL_TO_ID: Dict[str, int] = {
    "happy": 0,
    "sad": 1,
    "angry": 2,
    "fear": 3,
    "surprise": 4,
    "disgust": 5,
    "neutral": 6
}

ID_TO_LABEL: Dict[int, str] = {v: k for k, v in LABEL_TO_ID.items()}

# Granular dataset mapping dictionaries
# MELD Mapping: Direct 1-to-1 semantic equivalence
MELD_LABEL_MAP = {
    "joy": "happy",
    "happy": "happy",
    "sadness": "sad",
    "sad": "sad",
    "anger": "angry",
    "angry": "angry",
    "fear": "fear",
    "fearful": "fear",
    "surprise": "surprise",
    "surprised": "surprise",
    "disgust": "disgust",
    "disgusted": "disgust",
    "neutral": "neutral"
}

# IEMOCAP Categorical Mapping
IEMOCAP_LABEL_MAP = {
    "neu": "neutral",
    "neutral": "neutral",
    "hap": "happy",
    "happy": "happy",
    "happiness": "happy",
    "exc": "happy",  # Excited merged with Happy in standard 4-class IEMOCAP literature
    "excited": "happy",
    "sad": "sad",
    "sadness": "sad",
    "ang": "angry",
    "angry": "angry",
    "anger": "angry",
    "sur": "surprise",
    "surprise": "surprise",
    "fea": "fear",
    "fear": "fear",
    "dis": "disgust",
    "disgust": "disgust"
}

# RAVDESS Categorical Mapping (RAVDESS Emotion Code -> Standard MindSense 7-Class)
# 01 -> neutral -> label_id 6
# 03 -> happy   -> label_id 0
# 04 -> sad     -> label_id 1
# 05 -> angry   -> label_id 2
# 06 -> fear    -> label_id 3
# 07 -> disgust -> label_id 5
# 08 -> surprise-> label_id 4
RAVDESS_LABEL_MAP = {
    "01": "neutral",
    "03": "happy",
    "04": "sad",
    "05": "angry",
    "06": "fear",
    "07": "disgust",
    "08": "surprise",
    # Direct name mapping fallback
    "neutral": "neutral",
    "happy": "happy",
    "sad": "sad",
    "sadness": "sad",
    "angry": "angry",
    "anger": "angry",
    "fear": "fear",
    "fearful": "fear",
    "disgust": "disgust",
    "disgusted": "disgust",
    "surprise": "surprise",
    "surprised": "surprise"
}

# Explicitly unmappable or ambiguous classes requiring separate experimental treatment
UNMAPPABLE_CLASSES = {
    "iemocap": {
        "fru": "Frustration is a complex compound affective state distinct from pure Anger. Requires dedicated multi-label experiment.",
        "frustration": "Frustration is a complex compound affective state distinct from pure Anger. Requires dedicated multi-label experiment.",
        "oth": "Other is an uninformative catch-all category.",
        "other": "Other is an uninformative catch-all category.",
        "xxx": "No annotator consensus reached."
    },
    "meld": {},
    "ravdess": {
        "02": "Calm (02) is an affective state not present in standard 7-class Ekman/MELD taxonomy; excluded from 7-class benchmark.",
        "calm": "Calm (02) is an affective state not present in standard 7-class Ekman/MELD taxonomy; excluded from 7-class benchmark."
    },
    "cmu_mosei": {
        "continuous_sentiment": "CMU-MOSEI uses continuous multidimensional intensities in [0, 3]. Cannot be silently coerced to discrete single-label classes without thresholding."
    }
}


@dataclass
class LabelMappingResult:
    original_label: str
    normalized_label: Optional[str]
    label_id: Optional[int]
    dataset: str
    mapping_version: str
    is_valid: bool
    rejection_reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "original_label": self.original_label,
            "normalized_label": self.normalized_label,
            "label_id": self.label_id,
            "dataset": self.dataset,
            "mapping_version": self.mapping_version,
            "is_valid": self.is_valid,
            "rejection_reason": self.rejection_reason
        }


def normalize_label(original_label: str, dataset: str = "meld") -> LabelMappingResult:
    """
    Normalizes a dataset-specific emotion label into the standardized MindSense taxonomy.
    Rejects ambiguous, unknown, or unmappable labels explicitly.

    Args:
        original_label: Raw label string from source corpus (e.g., 'joy', 'neu', '01', '03').
        dataset: Source corpus identifier ('meld', 'iemocap', 'ravdess', 'cmu_mosei').

    Returns:
        LabelMappingResult dataclass with normalized label, ID, and provenance metadata.
    """
    if not original_label or not isinstance(original_label, str):
        return LabelMappingResult(
            original_label=str(original_label),
            normalized_label=None,
            label_id=None,
            dataset=dataset,
            mapping_version=MAPPING_VERSION,
            is_valid=False,
            rejection_reason="Label is empty or not a string."
        )

    clean_raw = original_label.strip().lower()
    dataset_key = dataset.strip().lower()

    # Check for known unmappable labels
    if dataset_key in UNMAPPABLE_CLASSES and clean_raw in UNMAPPABLE_CLASSES[dataset_key]:
        return LabelMappingResult(
            original_label=original_label,
            normalized_label=None,
            label_id=None,
            dataset=dataset_key,
            mapping_version=MAPPING_VERSION,
            is_valid=False,
            rejection_reason=UNMAPPABLE_CLASSES[dataset_key][clean_raw]
        )

    norm_label: Optional[str] = None

    if dataset_key == "meld":
        norm_label = MELD_LABEL_MAP.get(clean_raw)
    elif dataset_key == "iemocap":
        norm_label = IEMOCAP_LABEL_MAP.get(clean_raw)
    elif dataset_key == "ravdess":
        norm_label = RAVDESS_LABEL_MAP.get(clean_raw)
    elif dataset_key == "cmu_mosei":
        return LabelMappingResult(
            original_label=original_label,
            normalized_label=None,
            label_id=None,
            dataset=dataset_key,
            mapping_version=MAPPING_VERSION,
            is_valid=False,
            rejection_reason="CMU-MOSEI requires multi-label regression processing; discrete single-label mapping is disabled."
        )
    else:
        # Fallback direct check against standard emotions
        if clean_raw in STANDARD_EMOTIONS:
            norm_label = clean_raw

    if norm_label is None or norm_label not in LABEL_TO_ID:
        return LabelMappingResult(
            original_label=original_label,
            normalized_label=None,
            label_id=None,
            dataset=dataset_key,
            mapping_version=MAPPING_VERSION,
            is_valid=False,
            rejection_reason=f"Unknown or unmapped label '{original_label}' for dataset '{dataset}'."
        )

    label_id = LABEL_TO_ID[norm_label]
    return LabelMappingResult(
        original_label=original_label,
        normalized_label=norm_label,
        label_id=label_id,
        dataset=dataset_key,
        mapping_version=MAPPING_VERSION,
        is_valid=True,
        rejection_reason=None
    )


def get_label_id(normalized_label: str) -> int:
    """Returns the integer class ID for a normalized emotion label."""
    norm = normalized_label.strip().lower()
    if norm not in LABEL_TO_ID:
        raise ValueError(f"Unknown normalized emotion label: '{normalized_label}'. Valid: {STANDARD_EMOTIONS}")
    return LABEL_TO_ID[norm]


def get_label_name(label_id: int) -> str:
    """Returns the string name for a class ID."""
    if label_id not in ID_TO_LABEL:
        raise ValueError(f"Invalid emotion label ID: {label_id}. Valid range: 0 to {len(STANDARD_EMOTIONS)-1}")
    return ID_TO_LABEL[label_id]
