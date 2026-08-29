# Reproducibility & Provenance Standard — MindSense

**Project**: MindSense — Multimodal Emotion & Mental Health Monitoring System  
**Document Version**: 1.0 (Phase 0 Foundation)  
**Status**: Formal Standard  

---

## 1. Reproducibility Mandate

Scientific credibility in affective computing requires that all reported metrics can be independently reproduced. Every future training, validation, and evaluation experiment must adhere to the standardized reproducibility constraints defined in this document.

---

## 2. Deterministic Execution & Seed Management

All pseudorandom number generators (PRNGs) must be seeded deterministically across all supporting software libraries:

```python
import os
import random
import numpy as np
import torch

def set_global_seed(seed: int = 42):
    """
    Sets global deterministic seeds across Python, NumPy, and PyTorch backends.
    """
    random.seed(seed)
    os.environ['PYTHONHASHSEED'] = str(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
```

- **Primary Benchmark Seed**: `42`
- **Multi-Seed Validation Protocol**: All primary hypothesis experiments (`H1`–`H6`) must be evaluated across 5 distinct random seeds: `[42, 1337, 2026, 7, 999]`. Results must report mean and standard deviation ($\mu \pm \sigma$).

---

## 3. Dependency & Environment Freezing

1. **Python Environment**:
   - Python version strictly locked (e.g. `3.11.x`).
   - Package dependencies locked via pinned `requirements.txt` with exact hashes or lockfiles (`Pipfile.lock` / `poetry.lock`).
2. **PyTorch & CUDA Backend**:
   - Explicit recording of PyTorch version, CUDA runtime version, and cuDNN driver release.
3. **Frontend Build**:
   - Node.js version locked (`v20.x LTS`).
   - `package-lock.json` committed to version control.

---

## 4. Configuration & Experiment Metadata Schema

Every training run must emit a machine-readable JSON metadata file `config.json` alongside the saved model checkpoint:

```json
{
    "experiment_id": "EXP-E06-ATTN-FUSION-042",
    "timestamp_utc": "2026-08-30T12:00:00Z",
    "git_commit_sha": "a1b2c3d4e5f6...",
    "global_seed": 42,
    "hardware": {
        "cpu": "Intel Core i7-13700H",
        "gpu": "NVIDIA GeForce RTX 4070 Laptop GPU",
        "cuda_version": "12.2",
        "torch_version": "2.2.0"
    },
    "dataset": {
        "name": "IEMOCAP",
        "version": "v1.2_preprocessed",
        "split_type": "subject_independent_5fold",
        "fold_index": 1,
        "train_samples": 4290,
        "val_samples": 1070,
        "test_samples": 1200
    },
    "model_hyperparameters": {
        "architecture": "MultimodalFusionTransformer",
        "d_model": 256,
        "nhead": 4,
        "num_layers": 2,
        "dropout": 0.1,
        "num_classes": 7
    },
    "training_hyperparameters": {
        "optimizer": "AdamW",
        "learning_rate": 0.0001,
        "weight_decay": 0.01,
        "batch_size": 32,
        "max_epochs": 50,
        "early_stopping_patience": 7,
        "loss_function": "CrossEntropyLoss"
    }
}
```

---

## 5. Checkpoint Naming & Storage Convention

Checkpoints must follow standardized semantic naming:
```
checkpoints/
├── {EXPERIMENT_ID}_{DATASET}_{SPLIT}_seed{SEED}_epoch{EPOCH}_valF1-{F1}.pt
└── {EXPERIMENT_ID}_{DATASET}_{SPLIT}_seed{SEED}_config.json
```

Examples:
- `E06_IEMOCAP_fold1_seed42_epoch18_valF1-0.784.pt`
- `E07_MELD_subjectDisjoint_seed1337_epoch22_valF1-0.692.pt`

All checkpoint serialization must enforce `weights_only=True` during loading to ensure security.

---

## 6. Metrics Storage & Logging Policy

1. **Raw Log Streams**: Raw stdout, stderr, and batch-wise training metrics must be written to disk in `.system_generated/logs/` or dedicated experiment directories.
2. **Evaluation Metrics Payload**: All test evaluations must write structured evaluation summaries:
   - `eval_metrics.json`: Top-1 Accuracy, Macro F1, Weighted F1, Class-wise Precision/Recall, ECE, Brier score.
   - `confusion_matrix.json`: $K \times K$ raw integer count matrix.
   - `calibration_bins.json`: 10-bin confidence vs. accuracy distributions.
3. **Immutability**: Once an experiment folder is tagged and committed, metric files must never be manually overwritten or modified.
