import torch
import torch.nn as nn

class VisionEncoder(nn.Module):
    def __init__(self, in_channels: int = 1, hidden_dim: int = 64, num_classes: int = 7):
        super(VisionEncoder, self).__init__()
        
        # 2D CNN architecture for facial expression extraction
        self.conv1 = nn.Conv2d(in_channels, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, hidden_dim, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(hidden_dim)
        
        self.relu = nn.ReLU()
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))
        
        # Projections
        self.fc_embed = nn.Linear(hidden_dim, hidden_dim)
        self.classifier = nn.Linear(hidden_dim, num_classes)
        
    def forward(self, x):
        # Input shape: (batch_size, 1, 48, 48)
        x = self.pool(self.relu(self.bn1(self.conv1(x))))  # (batch_size, 32, 24, 24)
        x = self.pool(self.relu(self.bn2(self.conv2(x))))  # (batch_size, 64, 12, 12)
        x = self.relu(self.bn3(self.conv3(x)))             # (batch_size, 64, 12, 12)
        
        # Global Average Pooling
        out = self.global_pool(x).squeeze(-1).squeeze(-1)  # (batch_size, hidden_dim)
        
        # Feature representation
        embedding = self.fc_embed(out)
        
        # Unimodal logits
        logits = self.classifier(embedding)
        
        return embedding, logits
