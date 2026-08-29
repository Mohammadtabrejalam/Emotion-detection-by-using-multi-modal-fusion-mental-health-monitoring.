import torch
import torch.nn as nn
from .text_encoder import TextEncoder
from .audio_encoder import AudioEncoder
from .vision_encoder import VisionEncoder

class MultimodalFusionModel(nn.Module):
    def __init__(self, num_classes: int = 7, d_model: int = 64, nhead: int = 4):
        super(MultimodalFusionModel, self).__init__()
        
        # Instantiate unimodal encoders
        self.text_encoder = TextEncoder(num_classes=num_classes, hidden_dim=d_model)
        self.audio_encoder = AudioEncoder(num_classes=num_classes, hidden_dim=d_model)
        self.vision_encoder = VisionEncoder(num_classes=num_classes, hidden_dim=d_model)
        
        # Learnable modality embeddings (token-specific positional encodings)
        # Size: [1, 3, d_model] -> [Text, Audio, Image]
        self.modality_embeddings = nn.Parameter(torch.randn(1, 3, d_model))
        
        # Multimodal self-attention layer (Fusion Transformer)
        self.attention = nn.MultiheadAttention(embed_dim=d_model, num_heads=nhead, batch_first=True)
        
        # Projection layers (optional, encoders already project to d_model=64)
        self.proj_text = nn.Linear(d_model, d_model)
        self.proj_audio = nn.Linear(d_model, d_model)
        self.proj_vision = nn.Linear(d_model, d_model)
        
        # Classification MLP
        self.classifier = nn.Sequential(
            nn.Linear(d_model, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, num_classes)
        )
        
    def forward(self, text_input=None, audio_input=None, vision_input=None):
        """
        Args:
            text_input: Token indices tensor of shape (batch_size, seq_len) or None
            audio_input: MFCC features tensor of shape (batch_size, num_frames, 13) or None
            vision_input: Facial image tensor of shape (batch_size, 1, 48, 48) or None
            
        Returns:
            dict: {
                "multimodal_logits": Tensor,
                "text_logits": Tensor or None,
                "audio_logits": Tensor or None,
                "vision_logits": Tensor or None,
                "attention_weights": Tensor or None
            }
        """
        # Batch size lookup
        batch_size = 1
        if text_input is not None:
            batch_size = text_input.size(0)
        elif audio_input is not None:
            batch_size = audio_input.size(0)
        elif vision_input is not None:
            batch_size = vision_input.size(0)
            
        device = next(self.parameters()).device
        
        # Get unimodal embeddings and logits
        text_emb = torch.zeros(batch_size, 64, device=device)
        text_logits = None
        if text_input is not None:
            text_emb, text_logits = self.text_encoder(text_input)
            text_emb = self.proj_text(text_emb)
            
        audio_emb = torch.zeros(batch_size, 64, device=device)
        audio_logits = None
        if audio_input is not None:
            audio_emb, audio_logits = self.audio_encoder(audio_input)
            audio_emb = self.proj_audio(audio_emb)
            
        vision_emb = torch.zeros(batch_size, 64, device=device)
        vision_logits = None
        if vision_input is not None:
            vision_emb, vision_logits = self.vision_encoder(vision_input)
            vision_emb = self.proj_vision(vision_emb)
            
        # Modality mask: True indicates missing modality (for key_padding_mask in MultiheadAttention)
        # Note: key_padding_mask expects shape (batch_size, seq_len)
        mask = torch.zeros(batch_size, 3, dtype=torch.bool, device=device)
        if text_input is None:
            mask[:, 0] = True
        if audio_input is None:
            mask[:, 1] = True
        if vision_input is None:
            mask[:, 2] = True
            
        # Form sequence: shape (batch_size, 3, 64)
        seq = torch.stack([text_emb, audio_emb, vision_emb], dim=1)
        
        # Add modality-specific embeddings
        seq = seq + self.modality_embeddings
        
        # Multi-head Self-Attention
        # We pass key_padding_mask to ignore missing modalities
        attn_out, attn_weights = self.attention(seq, seq, seq, key_padding_mask=mask)
        
        # Global pooling over active modalities
        # Compute dynamic average: sum active tokens / count of active tokens
        active_counts = (~mask).sum(dim=1, keepdim=True).float()  # (batch_size, 1)
        # Ensure we don't divide by zero (if all modalities are somehow missing, active_counts=0)
        active_counts = torch.clamp(active_counts, min=1.0)
        
        # Apply mask to attention output (multiply missing tokens by 0)
        attn_out_masked = attn_out * (~mask).unsqueeze(-1).float()
        pooled = attn_out_masked.sum(dim=1) / active_counts
        
        # Classification
        multimodal_logits = self.classifier(pooled)
        
        return {
            "multimodal_logits": multimodal_logits,
            "text_logits": text_logits,
            "audio_logits": audio_logits,
            "vision_logits": vision_logits,
            "attention_weights": attn_weights
        }
