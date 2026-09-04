import json
from pathlib import Path

import torch

from backend.app.ml.fusion.missing_modality import (
    MODALITIES,
    apply_missing_mask,
    generate_missing_mask,
)


def test_modalities_definition():
    assert MODALITIES == ("text", "audio", "vision")


def test_generate_missing_mask_shape():
    mask = generate_missing_mask(
        batch_size=100,
        missing_rate=0.5,
        seed=42,
    )

    assert mask.shape == (100, 3)
    assert mask.dtype == torch.float32


def test_generate_missing_mask_is_deterministic():
    mask1 = generate_missing_mask(
        batch_size=100,
        missing_rate=0.5,
        seed=42,
    )

    mask2 = generate_missing_mask(
        batch_size=100,
        missing_rate=0.5,
        seed=42,
    )

    assert torch.equal(mask1, mask2)


def test_generate_missing_mask_contains_only_valid_values():
    mask = generate_missing_mask(
        batch_size=100,
        missing_rate=0.5,
        seed=42,
    )

    assert torch.all((mask == 0) | (mask == 1))


def test_generate_missing_mask_rate_is_approximately_correct():
    mask = generate_missing_mask(
        batch_size=10000,
        missing_rate=0.5,
        seed=42,
    )

    actual_missing_rate = (mask == 0).float().mean().item()

    assert 0.48 <= actual_missing_rate <= 0.52


def test_all_modalities_can_be_missing():
    mask = generate_missing_mask(
        batch_size=1000,
        missing_rate=0.5,
        seed=42,
    )

    all_missing = (mask.sum(dim=1) == 0).sum().item()

    assert all_missing > 0


def test_apply_missing_mask_zero_fills_missing_modalities():
    tensors = {
        "text": torch.ones(2, 4),
        "audio": torch.ones(2, 4),
        "vision": torch.ones(2, 4),
    }

    mask = torch.tensor(
        [
            [1, 0, 1],
            [0, 1, 0],
        ],
        dtype=torch.float32,
    )

    masked = apply_missing_mask(tensors, mask)

    assert torch.equal(masked["text"][0], torch.ones(4))
    assert torch.equal(masked["audio"][0], torch.zeros(4))
    assert torch.equal(masked["vision"][0], torch.ones(4))

    assert torch.equal(masked["text"][1], torch.zeros(4))
    assert torch.equal(masked["audio"][1], torch.ones(4))
    assert torch.equal(masked["vision"][1], torch.zeros(4))


def test_apply_missing_mask_preserves_available_modalities():
    tensors = {
        "text": torch.randn(4, 64),
        "audio": torch.randn(4, 64),
        "vision": torch.randn(4, 64),
    }

    original = {name: value.clone() for name, value in tensors.items()}

    mask = torch.ones(4, 3)

    masked = apply_missing_mask(tensors, mask)

    for modality in MODALITIES:
        assert torch.equal(masked[modality], original[modality])


def test_text_missing_condition():
    mask = torch.tensor(
        [[0, 1, 1]],
        dtype=torch.float32,
    )

    assert mask[0, 0] == 0
    assert mask[0, 1] == 1
    assert mask[0, 2] == 1


def test_audio_missing_condition():
    mask = torch.tensor(
        [[1, 0, 1]],
        dtype=torch.float32,
    )

    assert mask[0, 0] == 1
    assert mask[0, 1] == 0
    assert mask[0, 2] == 1


def test_vision_missing_condition():
    mask = torch.tensor(
        [[1, 1, 0]],
        dtype=torch.float32,
    )

    assert mask[0, 0] == 1
    assert mask[0, 1] == 1
    assert mask[0, 2] == 0
