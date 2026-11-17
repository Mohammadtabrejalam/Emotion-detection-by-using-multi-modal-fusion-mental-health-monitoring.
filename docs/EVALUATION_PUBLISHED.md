# Reproduce actual serving-model evaluation

For the later actor-separated comparison, see [fusion research reproduction](../research/fusion_v2/README.md). It adds fitting/validation/test separation, seven same-sample baselines, calibration, per-actor analysis, score-level stress checks and uncertainty estimates. The original evaluations below remain unchanged.

Install `backend/requirements-inference.txt`, FFmpeg, and `scikit-learn`, then download checkpoints with `python -m scripts.download_models`. Run scripts as modules from the repository root. The model revisions are pinned in the registry; the downloader records weight SHA256 hashes. This evaluation did not train weights or tune thresholds on the reported labels.

## MELD text

Source: [official MELD repository](https://github.com/declare-lab/MELD), commit `e8cedf27b5d2877e198332c957127e16eb214afe`, `data/MELD/test_sent_emo.csv`.

```text
git clone https://github.com/declare-lab/MELD.git external-meld
git -C external-meld checkout e8cedf27b5d2877e198332c957127e16eb214afe
python -m scripts.evaluate_published --meld-csv external-meld/data/MELD/test_sent_emo.csv --output reports/meld_text.json
```

Use the full 2,610-row official test CSV. Labels map joy→happy, sadness→sad, anger→angry. Each utterance is evaluated independently with the current seven-group adapter, without dialogue context. The source CSV SHA256 is recorded in the report. The measured 43.72% accuracy is below the 48.12% majority-neutral baseline; macro F1 is 0.270. This is cross-dataset transfer from GoEmotions, not reproduction of either model-card training metrics or a MELD-fine-tuned model.

## RAVDESS audiovisual diagnostic

Source: [official Zenodo record](https://zenodo.org/records/1188976), file `Video_Speech_Actor_01.zip` (552,968,353 bytes). Download directly from `https://zenodo.org/records/1188976/files/Video_Speech_Actor_01.zip?download=1`. Respect its **CC BY-NC-SA 4.0** dataset license; this test does not grant commercial redistribution rights. Do not commit downloaded media.

Extract the `01-01-*.mp4` full audiovisual speech clips for actor 01 to an external folder, then:

```text
python -m scripts.evaluate_published --ravdess-videos path/to/extracted/Actor_01 --output reports/ravdess_actor01.json
python -m scripts.smoke_real --clip path/to/extracted/Actor_01/01-01-01-01-01-01-01.mp4
```

The evaluator excludes calm rather than relabeling it neutral, uses a fixed midpoint video frame and exactly one detected face, and processes audio from the same clip. There are 52 eligible clips; none failed decoding/face detection in this run. Audio metrics use only the 28 clips in its four supported classes. Image and fusion use all 52 across seven classes. Reports include file hashes and individual predictions; no raw images or audio.

Audio: 46.43% accuracy / 0.366 macro F1. Image: 40.38% / 0.392. Fusion: 38.46% / 0.355. Do not compare audio's accuracy directly with seven-class results: sample/label spaces differ. The equal-weight fusion did not improve on image-only performance. One actor is not a representative benchmark; no confidence interval or generalization claim is offered.

## Interpretation and remaining work

No data leakage from app training is introduced because no app training occurred; original upstream training-data overlap cannot be comprehensively audited from published weights. Actor 01 is external to the documented IEMOCAP/FER2013 training sources. Three-way fusion is smoke-tested with authored text plus a clip, but **not benchmarked on aligned ground truth**. No fairness, calibration, clinical outcomes, or full-corpus speaker-independent evaluation has been completed. Broader evaluation and any fusion tuning require separate development and held-out test data.

Reference environment: Python 3.12, CPU PyTorch 2.15.0, Transformers 5.23.0, OpenCV 4.11.0.86, two OMP/MKL threads. Exact floating-point scores can vary with dependency/runtime versions. Report JSON is the evidence for this run; model-card metrics and unit-test doubles are not evidence of serving accuracy.

After both evaluator runs, rebuild the frontend-facing summary with `python -m scripts.summarize_evaluations`.
