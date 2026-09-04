"""
Production Multimodal Fusion Transformer Model — MindSense Phase 3
"""

from pathlib import Path
from typing import Dict, Any, Optional, Tuple, Union
import torch
import torch.nn as nn

from ..text_encoder import TextEncoder
from ..audio_encoder import AudioEncoder
from ..vision_encoder import VisionEncoder
from .config import PRETRAINED_CHECKPOINTS, D_MODEL, NHEAD, DROPOUT, NUM_CLASSES


class MultimodalFusionTransformer(nn.Module):
    """
    Multimodal Fusion Transformer Architecture.
    Combines Text, Audio, and Visual representations using Cross-Modal Self-Attention,
    Modality-Specific Embeddings, and Mask-Aware Global Pooling.
    """

    def __init__(
        self,
        num_classes: int = NUM_CLASSES,
        d_model: int = D_MODEL,
        nhead: int = NHEAD,
        dropout: float = DROPOUT,
        vocab_size: int = 1000,
        audio_input_dim: int = 13,
        vision_in_channels: int = 1
    ):
        super(MultimodalFusionTransformer, self).__init__()
        self.num_classes = num_classes
        self.d_model = d_model
        self.nhead = nhead

        # 1. Unimodal Encoders (Each produces 64-d embedding and unimodal logits)
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

        # 2. Learnable Modality Embeddings: (1, 3, 64) -> [Text, Audio, Vision]
        self.modality_embeddings = nn.Parameter(torch.randn(1, 3, d_model) * 0.02)

        # 3. Cross-Modal Multi-Head Self-Attention Layer
        self.attention = nn.MultiheadAttention(
            embed_dim=d_model,
            num_heads=nhead,
            dropout=dropout,
            batch_first=True
        )

        # 4. Classification Head: Linear(64, 32) -> ReLU -> Dropout -> Linear(32, 7)
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
        """Unfreezes unimodal encoder parameters for end-to-end fine-tuning."""
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

    def forward(
        self,
        text: Optional[torch.Tensor] = None,
        audio: Optional[torch.Tensor] = None,
        vision: Optional[torch.Tensor] = None,
        modality_mask: Optional[torch.Tensor] = None
    ) -> Dict[str, Any]:
        """
        Forward pass through Multimodal Fusion Transformer.

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
                - 'attention_weights': (batch_size, 3, 3) cross-modal attention matrix
                - 'pooled_embedding': (batch_size, d_model) mask-aware pooled fusion vector
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

        # 1. Unimodal Encoding -> (batch_size, 64)
        text_emb, text_logits = self.text_encoder(text)
        audio_emb, audio_logits = self.audio_encoder(audio)
        vision_emb, vision_logits = self.vision_encoder(vision)

        # Zero out embeddings for explicitly masked modalities
        t_mask = modality_mask[:, 0:1]
        a_mask = modality_mask[:, 1:2]
        v_mask = modality_mask[:, 2:3]

        text_emb = text_emb * t_mask
        audio_emb = audio_emb * a_mask
        vision_emb = vision_emb * v_mask

        # 2. Sequence Stacking: (batch_size, 3, 64)
        seq = torch.stack([text_emb, audio_emb, vision_emb], dim=1)

        # 3. Add Learnable Modality Embeddings
        seq = seq + self.modality_embeddings

        # 4. Cross-Modal Self-Attention with Key Padding Mask
        # key_padding_mask: True indicates token should be IGNORED by attention
        key_padding_mask = (modality_mask == 0.0)

        # Safety guard for all-masked samples (prevent softmax NaN)
        all_masked = key_padding_mask.all(dim=1)
        if all_masked.any():
            attn_mask = key_padding_mask.clone()
            attn_mask[all_masked] = False
        else:
            attn_mask = key_padding_mask

        attn_out, attn_weights = self.attention(
            seq, seq, seq,
            key_padding_mask=attn_mask,
            need_weights=True
        )

        # 5. Mask-Aware Global Pooling: sum(active outputs) / number of active modalities
        active_mask = (modality_mask > 0.0).float().unsqueeze(-1)  # (batch_size, 3, 1)
        attn_out_masked = attn_out * active_mask

        active_counts = modality_mask.sum(dim=1, keepdim=True)     # (batch_size, 1)
        divisor = active_counts.clamp(min=1.0)
        pooled = attn_out_masked.sum(dim=1) / divisor              # (batch_size, 64)

        if all_masked.any():
            pooled[all_masked] = 0.0

        # 6. Classification Head -> (batch_size, 7)
        logits = self.classifier(pooled)

        return {
            "logits": logits,
            "multimodal_logits": logits,
            "text_logits": text_logits,
            "audio_logits": audio_logits,
            "vision_logits": vision_logits,
            "attention_weights": attn_weights,
            "pooled_embedding": pooled
        }
