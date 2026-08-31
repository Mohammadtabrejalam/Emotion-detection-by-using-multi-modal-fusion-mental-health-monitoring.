# Dataset Validation & Integrity Audit

## Audit CLI Command

```bash
# Run comprehensive integrity and leakage audit
python -m backend.app.ml.data.validate_dataset
```

## Validation Checks
1. **Sample ID & Dialogue Uniqueness**: Zero sample ID or dialogue ID collision across splits.
2. **Physical Disk Verification**: Physical existence check of MP4 paths referenced in manifest.
3. **Modality Availability**: Verifies text, audio, and vision stream counts.
4. **Label Normalization**: Validates 7 standard affective categories (`angry`, `disgust`, `fear`, `happy`, `neutral`, `sad`, `surprise`).
