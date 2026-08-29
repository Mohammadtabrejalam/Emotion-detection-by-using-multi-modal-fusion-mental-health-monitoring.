import torch
import torch.nn as nn

class AudioEncoder(nn.Module):
    def __init__(self, input_dim: int = 13, hidden_dim: int = 64, num_classes: int = 7):
        super(AudioEncoder, self).__init__()
        
        # 1D CNN over audio feature frames (e.g. MFCCs)
        self.conv1 = nn.Conv1d(in_channels=input_dim, out_channels=32, kernel_size=5, padding=2)
        self.bn1 = nn.BatchNorm1d(32)
        self.conv2 = nn.Conv1d(in_channels=32, out_channels=64, kernel_size=5, padding=2)
        self.bn2 = nn.BatchNorm1d(64)
        self.conv3 = nn.Conv1d(in_channels=64, out_channels=hidden_dim, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm1d(hidden_dim)
        
        self.relu = nn.ReLU()
        self.pool = nn.MaxPool1d(kernel_size=2)
        self.global_pool = nn.AdaptiveAvgPool1d(1)
        
        # Projections
        self.fc_embed = nn.Linear(hidden_dim, hidden_dim)
        self.classifier = nn.Linear(hidden_dim, num_classes)
        
    def forward(self, x):
        # Input shape: (batch_size, num_frames, 13)
        # Reshape for Conv1D: (batch_size, 13, num_frames)
        x = x.transpose(1, 2)
        
        x = self.pool(self.relu(self.bn1(self.conv1(x))))
        x = self.pool(self.relu(self.bn2(self.conv2(x))))
        x = self.relu(self.bn3(self.conv3(x)))
        
        # Global Average Pooling
        out = self.global_pool(x).squeeze(-1)  # (batch_size, hidden_dim)
        
        # Feature representation
        embedding = self.fc_embed(out)
        
        # Unimodal logits
        logits = self.classifier(embedding)
        
        return embedding, logits
