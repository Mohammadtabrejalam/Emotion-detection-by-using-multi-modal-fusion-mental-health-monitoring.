import torch
import torch.nn as nn

class TextEncoder(nn.Module):
    def __init__(self, vocab_size: int = 1000, embed_dim: int = 64, 
                 hidden_dim: int = 64, num_classes: int = 7):
        super(TextEncoder, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        
        # 1D CNN to process embedding sequence
        self.conv1 = nn.Conv1d(in_channels=embed_dim, out_channels=hidden_dim, kernel_size=3, padding=1)
        self.conv2 = nn.Conv1d(in_channels=hidden_dim, out_channels=hidden_dim, kernel_size=3, padding=1)
        
        self.relu = nn.ReLU()
        self.pool = nn.AdaptiveMaxPool1d(1)
        
        # Projections
        self.fc_embed = nn.Linear(hidden_dim, hidden_dim)
        self.classifier = nn.Linear(hidden_dim, num_classes)
        
    def forward(self, x):
        # Input shape: (batch_size, seq_len)
        embedded = self.embedding(x)  # (batch_size, seq_len, embed_dim)
        
        # Reshape for Conv1D: (batch_size, embed_dim, seq_len)
        embedded = embedded.transpose(1, 2)
        
        out = self.relu(self.conv1(embedded))
        out = self.relu(self.conv2(out))
        
        # Global Max Pooling
        out = self.pool(out).squeeze(-1)  # (batch_size, hidden_dim)
        
        # Feature representation
        embedding = self.fc_embed(out)
        
        # Unimodal logits
        logits = self.classifier(embedding)
        
        return embedding, logits
