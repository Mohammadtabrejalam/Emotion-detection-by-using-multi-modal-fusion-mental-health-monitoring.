# Frozen expert fusion study

The reproducible study compares seven audiovisual methods on the same held-out RAVDESS clips. It is a project-specific empirical investigation, not a claim to invent reliability-aware fusion. The serving default is unchanged.

## Data and evaluation boundary

- Fitting: Actors 02 and 03, 104 clips.
- Validation: Actor 04, 52 clips.
- Test: Actors 05 and 06, 104 clips.
- Actor 01 is exploratory and excluded from fitting/selection/test. Calm is excluded rather than relabeled.
- Neural experts remain frozen. Temperatures and predicted-class reliability use fitting actors only; weights and entropy power use validation macro F1 only.
- The original procedure was restored and committed before rescoring. Outcomes had already been observed; this is reproduction, not independent validation. See [RECOVERY.md](RECOVERY.md).

The score cache includes clip identity, actor, source SHA256, model revisions, and actual probabilities. `results.json` contains parameters, complete validation selection traces, full held-out probabilities, metrics, confusion matrices, actor-specific results, stress checks and a seeded paired actor bootstrap. No raw media or model weights are committed.

## Findings

| Method on the same 104 test clips | Accuracy | Macro F1 |
| --- | ---: | ---: |
| Face only | 48.08% | 0.4848 |
| Existing serving fusion | 50.00% | 0.4933 |
| Adaptive class reliability | 52.88% | 0.5148 |

The gain is three additional correct clips over existing fusion. It is not consistent across actors: Actor 06 macro F1 falls. Validation selected zero entropy power and zero audio weight for the static hierarchy. Adaptive NLL and Brier loss improve, but ECE worsens against existing fusion. The two-actor bootstrap interval crosses zero and is too fragile for population inference. Existing fusion beats face-only on these actors, so the earlier Actor 01 loss is not a universal result.

The experiment measures score-level contamination and missing modalities. It does not measure live microphone noise or camera occlusion. Text is not included in this audiovisual study; aligned three-way performance remains unevaluated. Emotion labels are not clinical diagnoses.

## Reproduce from saved scores

From the repository root:

```bash
python -m pip install -r research/fusion_v2/requirements.txt
python -m pytest research/fusion_v2/test_experiment.py -q
python -m research.fusion_v2.experiment
python -m scripts.check_fusion_reproduction
python -m scripts.verify_report_evidence
```

This does not download weights or media. The aggregate check compares against prior execution values for audit only; those values never enter fitting or selection. Full floating-point score bytes can vary with the runtime, so a mismatch must be investigated and reported without retuning on these test actors.

## Reproduce actual inference

Install CPU PyTorch, `backend/requirements-inference.txt`, the research requirements, `requests`, and FFmpeg. Follow the main README for environment setup. Then:

```bash
python -m scripts.download_models --modalities audio image
```

Archive or move the committed `research/fusion_v2/scores.jsonl` before a full fresh run; the collector resumes existing records by ID. Run:

```bash
python -m research.fusion_v2.collect
python -m research.fusion_v2.experiment
```

The collector downloads official [RAVDESS archives](https://zenodo.org/records/1188976). Dataset terms are CC BY-NC-SA 4.0; do not assume commercial usage rights. Allow several GB of temporary disk space and CPU inference time. `RAVDESS_CACHE` changes the ignored media directory. Use one collector process to maintain deterministic record order. `--actors` and `--cache-only` are recovery options; final evaluation requires every prespecified actor record.

The `Frozen audiovisual research reproduction` workflow performs real inference and preserves score artifacts. Its package list is in `reproduction_environment.txt`; `environment.json` describes the earlier local reproduction. The inference procedure and pinned models are the same. Future method changes need untouched actors or a newly registered split.

## Reports and verification

The [academic report](../../docs/ACADEMIC_REPORT.md), [DOCX](../../docs/MindSense_Academic_Report.docx), [PDF](../../docs/MindSense_Academic_Report.pdf), and [build instructions](../../docs/report_source/README.md) describe the application, equations, literature, measured findings and limitations.

The restored implementation passed 149 backend/research tests with five legacy skips, 10 frontend tests, six browser tests, production build and container startup in CI. See `verification.json` for commit/run provenance. Browser screenshots are genuine CI captures; the result screenshot is actual text inference with only text weights installed, not a three-modality browser-inference demonstration.
