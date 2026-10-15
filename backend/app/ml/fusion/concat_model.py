"""
Multimodal Concatenation Fusion Baseline Model — MindSense Phase 7 Step 1

Baseline architecture comparing a simpler concatenation-plus-linear-projection
fusion mechanism against the E04 attention-based fusion mechanism.

Architecture:
    Text (64D) + Audio (64D) + Vision (64D)
    -> Concatenate (192D)
    -> Linear(192, 64)
    -> Classification Head:
         Linear(64, 32) -> ReLU -> Dropout(0.1) -> Linear(32, 7)
"""

from pathlib import Path
from typing import Dict, Any, Optional, Union
import torch
import torch.nn as nn

from ..text_encoder import TextEncoder
from ..audio_encoder import AudioEncoder
from ..vision_encoder import VisionEncoder
from .config import PRETRAINED_CHECKPOINTS, D_MODEL, DROPOUT, NUM_CLASSES


class MultimodalConcatenationFusion(nn.Module):
    """
    Multimodal Concatenation Fusion Baseline Model.

    Combines Text (64D), Audio (64D), and Vision (64D) representations using
    direct concatenation to 192D, followed by a linear projection to 64D
    and the identical 64 -> 32 -> 7 classification head as E04.
    """

    def __init__(
        self,
        num_classes: int = NUM_CLASSES,
        d_model: int = D_MODEL,
        dropout: float = DROPOUT,
        vocab_size: int = 1000,
        audio_input_dim: int = 13,
        vision_in_channels: int = 1
    ):
        super(MultimodalConcatenationFusion, self).__init__()
        self.num_classes = num_classes
        self.d_model = d_model
        self.concat_dim = d_model * 3  # 64 * 3 = 192

        # 1. Unimodal Encoders (Identical to E04, producing 64D embeddings)
        self.text_encoder = TextEncoder(
            vocab_size=vocab_size,
            embed_dim=d_model,
            hidden_dim=d_model,
            num_classes=num_classes
        )
        self.audio_encoder = AudioEncoder(
            input_dim=audio_input_dim,
            hidden_dim=d_model,
            num_classes=num_classes
        )
        self.vision_encoder = VisionEncoder(
            in_channels=vision_in_channels,
            hidden_dim=d_model,
            num_classes=num_classes
        )

        # 2. Linear Projection: 192D -> 64D
        self.projection = nn.Linear(self.concat_dim, d_model)

        # 3. Classification Head (Identical to E04): Linear(64, 32) -> ReLU -> Dropout(0.1) -> Linear(32, 7)
        self.classifier = nn.Sequential(
            nn.Linear(d_model, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, num_classes)
        )

    def freeze_backbones(self) -> None:
        """Freezes unimodal encoder parameters for feature-extraction training."""
        for param in self.text_encoder.parameters():
            param.requires_grad = False
        for param in self.audio_encoder.parameters():
            param.requires_grad = False
        for param in self.vision_encoder.parameters():
            param.requires_grad = False

    def unfreeze_backbones(self) -> None:
        """Unfreezes unimodal encoder parameters for fine-tuning."""
        for param in self.text_encoder.parameters():
            param.requires_grad = True
        for param in self.audio_encoder.parameters():
            param.requires_grad = True
        for param in self.vision_encoder.parameters():
            param.requires_grad = True

    def load_pretrained_backbones(
        self,
        checkpoint_paths: Optional[Dict[str, Union[str, Path]]] = None,
        freeze: bool = True,
        map_location: Union[str, torch.device] = "cpu"
    ) -> Dict[str, bool]:
        """
        Loads Phase 2 unimodal baseline checkpoints into sub-encoders.

        Args:
            checkpoint_paths: Dictionary mapping 'text', 'audio', 'vision' to checkpoint paths.
            freeze: If True, freezes backbone parameters after loading.
            map_location: Device to map checkpoints to during loading.

        Returns:
            Dictionary of loading status flags for each modality.
        """
        paths = checkpoint_paths or PRETRAINED_CHECKPOINTS
        status = {"text": False, "audio": False, "vision": False}

        # Text Encoder
        if "text" in paths and paths["text"] is not None:
            t_path = Path(paths["text"])
            if t_path.exists():
                ckpt = torch.load(t_path, map_location=map_location, weights_only=True)
                state = ckpt.get("model_state_dict", ckpt)
                self.text_encoder.load_state_dict(state)
                status["text"] = True

        # Audio Encoder
        if "audio" in paths and paths["audio"] is not None:
            a_path = Path(paths["audio"])
            if a_path.exists():
                ckpt = torch.load(a_path, map_location=map_location, weights_only=True)
                state = ckpt.get("model_state_dict", ckpt)
                self.audio_encoder.load_state_dict(state)
                status["audio"] = True

        # Vision Encoder
        if "vision" in paths and paths["vision"] is not None:
            v_path = Path(paths["vision"])
            if v_path.exists():
                ckpt = torch.load(v_path, map_location=map_location, weights_only=True)
                state = ckpt.get("model_state_dict", ckpt)
                self.vision_encoder.load_state_dict(state)
                status["vision"] = True

        if freeze:
            self.freeze_backbones()
        else:
            self.unfreeze_backbones()

        return status

    def get_parameter_counts(self) -> Dict[str, int]:
        """Returns total, trainable, and frozen parameter counts."""
        total = sum(p.numel() for p in self.parameters())
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        frozen = total - trainable
        return {
            "total": total,
            "trainable": trainable,
            "frozen": frozen,
            "projection": sum(p.numel() for p in self.projection.parameters()),
            "classifier": sum(p.numel() for p in self.classifier.parameters())
        }

    def forward(
        self,
        text: Optional[torch.Tensor] = None,
        audio: Optional[torch.Tensor] = None,
        vision: Optional[torch.Tensor] = None,
        modality_mask: Optional[torch.Tensor] = None
    ) -> Dict[str, Any]:
        """
        Forward pass through Multimodal Concatenation Fusion Baseline.

        Args:
            text: Token sequence tensor of shape (batch_size, 64) [torch.long] or None.
            audio: MFCC features tensor of shape (batch_size, 200, 13) [torch.float32] or None.
            vision: Face crop tensor of shape (batch_size, 1, 48, 48) [torch.float32] or None.
            modality_mask: Availability mask tensor of shape (batch_size, 3) [torch.float32]
                           where 1.0 indicates available and 0.0 indicates missing/masked.

        Returns:
            Dict containing:
                - 'logits': (batch_size, num_classes) classification logits
                - 'multimodal_logits': alias for 'logits'
                - 'text_logits': (batch_size, num_classes) or None
                - 'audio_logits': (batch_size, num_classes) or None
                - 'vision_logits': (batch_size, num_classes) or None
                - 'concat_embedding': (batch_size, 192) concatenated embedding
                - 'pooled_embedding': (batch_size, d_model) 64D projected embedding
        """
        device = next(self.parameters()).device

        # Determine batch size
        batch_size = 1
        for inp in [text, audio, vision, modality_mask]:
            if inp is not None:
                batch_size = inp.shape[0]
                break

        # Resolve inputs with zero tensors if None
        if text is None:
            text = torch.zeros((batch_size, 64), dtype=torch.long, device=device)
            text_avail = False
        else:
            text = text.to(device)
            text_avail = True

        if audio is None:
            audio = torch.zeros((batch_size, 200, 13), dtype=torch.float32, device=device)
            audio_avail = False
        else:
            audio = audio.to(device)
            audio_avail = True

        if vision is None:
            vision = torch.zeros((batch_size, 1, 48, 48), dtype=torch.float32, device=device)
            vision_avail = False
        else:
            vision = vision.to(device)
            vision_avail = True

        # Resolve modality mask: (batch_size, 3) -> [Text, Audio, Vision]
        if modality_mask is None:
            modality_mask = torch.tensor(
                [[1.0 if text_avail else 0.0, 1.0 if audio_avail else 0.0, 1.0 if vision_avail else 0.0]],
                dtype=torch.float32,
                device=device
            ).repeat(batch_size, 1)
        else:
            modality_mask = modality_mask.to(device=device, dtype=torch.float32)

        # 1. Unimodal Encoding -> each produces (batch_size, 64)
        text_emb, text_logits = self.text_encoder(text)
        audio_emb, audio_logits = self.audio_encoder(audio)
        vision_emb, vision_logits = self.vision_encoder(vision)

        # Zero out embeddings for explicitly masked or missing modalities
        t_mask = modality_mask[:, 0:1]
        a_mask = modality_mask[:, 1:2]
        v_mask = modality_mask[:, 2:3]

        text_emb = text_emb * t_mask
        audio_emb = audio_emb * a_mask
        vision_emb = vision_emb * v_mask

        # 2. Concatenate embeddings along feature dimension -> (batch_size, 192)
        concat_emb = torch.cat([text_emb, audio_emb, vision_emb], dim=-1)

        # 3. Linear Projection: 192D -> 64D
        projected = self.projection(concat_emb)

        # 4. Classification Head -> (batch_size, 7)
        logits = self.classifier(projected)

        return {
            "logits": logits,
            "multimodal_logits": logits,
            "text_logits": text_logits,
            "audio_logits": audio_logits,
            "vision_logits": vision_logits,
            "concat_embedding": concat_emb,
            "pooled_embedding": projected
        }
