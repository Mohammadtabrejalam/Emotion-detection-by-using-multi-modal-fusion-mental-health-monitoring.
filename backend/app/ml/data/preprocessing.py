"""
Reproducible Multimodal Preprocessing Engine — MindSense
Version: 1.1.0 (Strict Path & Modality Integrity)
"""

import io
import os
from pathlib import Path
from typing import Tuple, Optional, Union
import numpy as np
import torch

from ..preprocessing.text import tokenize, clean_text
from ..preprocessing.audio import preprocess_audio, extract_mfcc
from ..preprocessing.vision import preprocess_image
from .config import (
    AUDIO_SAMPLE_RATE, AUDIO_TARGET_FRAMES, AUDIO_NUM_MFCC,
    VISION_IMAGE_SIZE, VISION_NUM_CHANNELS, TEXT_MAX_LENGTH
)


class DatasetPreprocessor:
    """
    Unified multimodal feature extraction engine for text, audio, and visual inputs.
    Converts real media files into deterministic PyTorch tensor representations.
    Distinguishes intentional missing modalities from broken file paths.
    """

    def __init__(
        self,
        text_max_len: int = TEXT_MAX_LENGTH,
        audio_target_frames: int = AUDIO_TARGET_FRAMES,
        audio_mfcc_dim: int = AUDIO_NUM_MFCC,
        vision_img_size: Tuple[int, int] = VISION_IMAGE_SIZE,
        strict_paths: bool = False
    ):
        self.text_max_len = text_max_len
        self.audio_target_frames = audio_target_frames
        self.audio_mfcc_dim = audio_mfcc_dim
        self.vision_img_size = vision_img_size
        self.strict_paths = strict_paths

    def process_text(self, text_content: Optional[str]) -> Tuple[torch.Tensor, bool]:
        """
        Tokenizes text string into padded sequence of integer token IDs.

        Returns:
            (token_tensor: torch.Tensor of shape (max_len,), is_available: bool)
        """
        if text_content is None or not isinstance(text_content, str) or not text_content.strip():
            return torch.zeros(self.text_max_len, dtype=torch.long), False

        try:
            token_ids = tokenize(text_content, max_length=self.text_max_len)
            tensor = torch.tensor(token_ids, dtype=torch.long)
            return tensor, True
        except Exception as e:
            if self.strict_paths:
                raise RuntimeError(f"Text tokenization failed: {e}")
            return torch.zeros(self.text_max_len, dtype=torch.long), False

    def process_audio(self, audio_source: Union[str, Path, bytes, None]) -> Tuple[torch.Tensor, bool]:
        """
        Extracts 13 MFCC coefficients over 200 temporal frames from audio path or bytes.

        Returns:
            (mfcc_tensor: torch.Tensor of shape (200, 13), is_available: bool)
        """
        if audio_source is None:
            # Intended missing modality
            return torch.zeros((self.audio_target_frames, self.audio_mfcc_dim), dtype=torch.float32), False

        try:
            if isinstance(audio_source, (str, Path)):
                path = Path(audio_source)
                if not path.exists():
                    if self.strict_paths:
                        raise FileNotFoundError(f"Audio file referenced in manifest not found on disk: {path}")
                    return torch.zeros((self.audio_target_frames, self.audio_mfcc_dim), dtype=torch.float32), False
                if path.stat().st_size == 0:
                    if self.strict_paths:
                        raise ValueError(f"Audio file is 0 bytes: {path}")
                    return torch.zeros((self.audio_target_frames, self.audio_mfcc_dim), dtype=torch.float32), False

                with open(path, "rb") as f:
                    audio_bytes = f.read()
                file_ext = path.suffix
            elif isinstance(audio_source, bytes):
                if len(audio_source) == 0:
                    return torch.zeros((self.audio_target_frames, self.audio_mfcc_dim), dtype=torch.float32), False
                audio_bytes = audio_source
                file_ext = ".wav"
            else:
                return torch.zeros((self.audio_target_frames, self.audio_mfcc_dim), dtype=torch.float32), False

            mfcc_arr = preprocess_audio(audio_bytes, file_ext=file_ext)
            if mfcc_arr is None or mfcc_arr.size == 0:
                return torch.zeros((self.audio_target_frames, self.audio_mfcc_dim), dtype=torch.float32), False

            if mfcc_arr.shape != (self.audio_target_frames, self.audio_mfcc_dim):
                if mfcc_arr.shape[0] < self.audio_target_frames:
                    pad_len = self.audio_target_frames - mfcc_arr.shape[0]
                    mfcc_arr = np.pad(mfcc_arr, ((0, pad_len), (0, 0)), mode="constant")
                else:
                    mfcc_arr = mfcc_arr[:self.audio_target_frames, :self.audio_mfcc_dim]

            tensor = torch.tensor(mfcc_arr, dtype=torch.float32)
            return tensor, True
        except (FileNotFoundError, ValueError):
            if self.strict_paths:
                raise
            return torch.zeros((self.audio_target_frames, self.audio_mfcc_dim), dtype=torch.float32), False
        except Exception as e:
            if self.strict_paths:
                raise RuntimeError(f"Audio preprocessing failed for '{audio_source}': {e}")
            return torch.zeros((self.audio_target_frames, self.audio_mfcc_dim), dtype=torch.float32), False

    def process_vision(self, vision_source: Union[str, Path, bytes, None]) -> Tuple[torch.Tensor, bool]:
        """
        Extracts grayscale face crop resized to 48x48 normalized to [0, 1].

        Returns:
            (face_tensor: torch.Tensor of shape (1, 48, 48), is_available: bool)
        """
        if vision_source is None:
            # Intended missing modality
            return torch.zeros((1, self.vision_img_size[0], self.vision_img_size[1]), dtype=torch.float32), False

        try:
            if isinstance(vision_source, (str, Path)):
                path = Path(vision_source)
                if not path.exists():
                    if self.strict_paths:
                        raise FileNotFoundError(f"Vision file referenced in manifest not found on disk: {path}")
                    return torch.zeros((1, self.vision_img_size[0], self.vision_img_size[1]), dtype=torch.float32), False
                if path.stat().st_size == 0:
                    if self.strict_paths:
                        raise ValueError(f"Vision file is 0 bytes: {path}")
                    return torch.zeros((1, self.vision_img_size[0], self.vision_img_size[1]), dtype=torch.float32), False

                with open(path, "rb") as f:
                    img_bytes = f.read()
            elif isinstance(vision_source, bytes):
                if len(vision_source) == 0:
                    return torch.zeros((1, self.vision_img_size[0], self.vision_img_size[1]), dtype=torch.float32), False
                img_bytes = vision_source
            else:
                return torch.zeros((1, self.vision_img_size[0], self.vision_img_size[1]), dtype=torch.float32), False

            face_arr, status = preprocess_image(img_bytes)
            if face_arr is None or status == "no_face":
                return torch.zeros((1, self.vision_img_size[0], self.vision_img_size[1]), dtype=torch.float32), False

            tensor = torch.tensor(face_arr, dtype=torch.float32)
            return tensor, True
        except (FileNotFoundError, ValueError):
            if self.strict_paths:
                raise
            return torch.zeros((1, self.vision_img_size[0], self.vision_img_size[1]), dtype=torch.float32), False
        except Exception as e:
            if self.strict_paths:
                raise RuntimeError(f"Vision preprocessing failed for '{vision_source}': {e}")
            return torch.zeros((1, self.vision_img_size[0], self.vision_img_size[1]), dtype=torch.float32), False
