"""
Speaker-Independent Dataset Splitting & Leakage Prevention — MindSense
"""

import random
from typing import List, Dict, Tuple, Set
from .manifest import SampleRecord, DatasetManifest


def partition_dataset_by_speaker(
    records: List[SampleRecord],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
    fixed_speaker_splits: Dict[str, Set[str]] = None
) -> List[SampleRecord]:
    """
    Partitions sample records into train, val, and test splits strictly at the speaker/actor level.
    Guarantees zero speaker overlap across partitions.

    Args:
        records: List of SampleRecord instances.
        train_ratio: Target proportion of samples/speakers in train partition.
        val_ratio: Target proportion of samples/speakers in val partition.
        test_ratio: Target proportion of samples/speakers in test partition.
        seed: Deterministic random seed for PRNG.
        fixed_speaker_splits: Optional explicit dictionary of {'train': set(speakers), 'val': set(), 'test': set()}.

    Returns:
        New list of SampleRecord instances with updated .split fields.
    """
    if not records:
        return []

    # Map speakers to their associated sample records
    speaker_to_records: Dict[str, List[SampleRecord]] = {}
    for r in records:
        spk = r.speaker_id.strip().lower()
        if spk not in speaker_to_records:
            speaker_to_records[spk] = []
        speaker_to_records[spk].append(r)

    all_speakers = sorted(list(speaker_to_records.keys()))

    if fixed_speaker_splits is not None:
        train_spks = fixed_speaker_splits.get("train", set())
        val_spks = fixed_speaker_splits.get("val", set())
        test_spks = fixed_speaker_splits.get("test", set())
    else:
        # Deterministic speaker shuffling
        rng = random.Random(seed)
        shuffled_speakers = list(all_speakers)
        rng.shuffle(shuffled_speakers)

        # Sort speakers by sample count descending for greedy bin-packing
        total_samples = len(records)
        target_train = int(total_samples * train_ratio)
        target_val = int(total_samples * val_ratio)

        train_spks: Set[str] = set()
        val_spks: Set[str] = set()
        test_spks: Set[str] = set()

        curr_train_count = 0
        curr_val_count = 0

        for spk in shuffled_speakers:
            spk_count = len(speaker_to_records[spk])
            if curr_train_count + spk_count <= target_train or (not train_spks):
                train_spks.add(spk)
                curr_train_count += spk_count
            elif curr_val_count + spk_count <= target_val or (not val_spks):
                val_spks.add(spk)
                curr_val_count += spk_count
            else:
                test_spks.add(spk)

        # Edge case: if test_spks is empty because of few speakers, allocate at least one speaker
        if not test_spks and len(val_spks) > 1:
            moved = val_spks.pop()
            test_spks.add(moved)

    # Validate speaker partition disjointness
    assert train_spks.isdisjoint(val_spks), "Train and Val speaker sets overlap!"
    assert train_spks.isdisjoint(test_spks), "Train and Test speaker sets overlap!"
    assert val_spks.isdisjoint(test_spks), "Val and Test speaker sets overlap!"

    # Create new records with updated split attributes
    updated_records: List[SampleRecord] = []
    for r in records:
        spk = r.speaker_id.strip().lower()
        if spk in train_spks:
            assigned_split = "train"
        elif spk in val_spks:
            assigned_split = "val"
        elif spk in test_spks:
            assigned_split = "test"
        else:
            assigned_split = "train"  # Fallback

        new_record = SampleRecord(
            sample_id=r.sample_id,
            dataset=r.dataset,
            speaker_id=r.speaker_id,
            session_id=r.session_id,
            utterance_id=r.utterance_id,
            text_content=r.text_content,
            has_text=r.has_text,
            has_audio=r.has_audio,
            has_vision=r.has_vision,
            label=r.label,
            label_id=r.label_id,
            original_label=r.original_label,
            label_source=r.label_source,
            split=assigned_split,
            quality_status=r.quality_status,
            text_path=r.text_path,
            audio_path=r.audio_path,
            video_path=r.video_path,
            duration_sec=r.duration_sec,
            sample_rate=r.sample_rate,
            frame_count=r.frame_count
        )
        updated_records.append(new_record)

    return updated_records


def validate_split_isolation(records: List[SampleRecord]) -> Tuple[bool, List[str]]:
    """
    Validates that no speaker ID or sample ID appears in more than one split partition.

    Returns:
        (is_valid: bool, errors: List[str])
    """
    errors: List[str] = []
    train_speakers: Set[str] = set()
    val_speakers: Set[str] = set()
    test_speakers: Set[str] = set()
    seen_samples: Dict[str, str] = {}

    for r in records:
        spk = r.speaker_id.strip().lower()
        split = r.split.strip().lower()

        # Check sample duplication across splits
        if r.sample_id in seen_samples:
            prev_split = seen_samples[r.sample_id]
            if prev_split != split:
                errors.append(f"Sample '{r.sample_id}' exists in both '{prev_split}' and '{split}' splits.")
        else:
            seen_samples[r.sample_id] = split

        # Record speakers per split
        if split == "train":
            train_speakers.add(spk)
        elif split in ["val", "dev"]:
            val_speakers.add(spk)
        elif split == "test":
            test_speakers.add(spk)
        else:
            errors.append(f"Unrecognized split name '{split}' for sample '{r.sample_id}'.")

    # Check speaker overlap
    train_val_overlap = train_speakers.intersection(val_speakers)
    if train_val_overlap:
        errors.append(f"Speaker overlap between TRAIN and VAL: {sorted(list(train_val_overlap))}")

    train_test_overlap = train_speakers.intersection(test_speakers)
    if train_test_overlap:
        errors.append(f"Speaker overlap between TRAIN and TEST: {sorted(list(train_test_overlap))}")

    val_test_overlap = val_speakers.intersection(test_speakers)
    if val_test_overlap:
        errors.append(f"Speaker overlap between VAL and TEST: {sorted(list(val_test_overlap))}")

    is_valid = len(errors) == 0
    return is_valid, errors
