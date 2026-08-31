# Real Dataset Ingestion Pipeline

## Ingestion CLI Command
To parse MELD dataset annotations and build the official manifest:

```bash
# Using environment variable MINDSENSE_MELD_ROOT
python -m backend.app.ml.data.prepare_meld

# Or passing explicit path override
python -m backend.app.ml.data.prepare_meld --meld-root "C:\path\to\MELD.Raw"
```

## Sample ID Resolution & Uniqueness
Dialogue IDs restart at `dia0` in each split CSV (`train_sent_emo.csv`, `dev_sent_emo.csv`, `test_sent_emo.csv`).
To ensure cross-split uniqueness and prevent duplicate ID dropping:
- `sample_id`: `meld_{split}_dia{dia_id}_utt{utt_id}` (e.g. `meld_train_dia0_utt0`, `meld_val_dia0_utt0`, `meld_test_dia0_utt0`).
- Total benchmark records parsed: **13,708 / 13,708**.

## Media Validation Rules
A sample record is marked complete (`quality_status = "valid"`) if and only if:
1. CSV record exists with non-empty text content (`has_text = True`).
2. Corresponding MP4 file exists on disk.
3. MP4 contains a valid video stream (`width > 0`, `height > 0`).
4. MP4 contains a valid audio stream (`channels > 0` or valid audio codec).
