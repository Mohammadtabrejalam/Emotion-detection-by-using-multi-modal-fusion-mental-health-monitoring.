# Paper study on partially overlapping emotion labels

This study asks whether preserving probability mass for classes that a speech
classifier cannot predict improves late fusion with a facial classifier. It is
a prospective extension of the exploratory `fusion_v2` experiment. It does not
replace the application or its default model.

## Evidence boundary

Actors 01–06 have already influenced the design and are excluded. The committed
protocol fixes six fitting actors (07–12), four validation actors (13–16) and
eight test actors (17–24), before collecting their scores. There are 312, 208
and 416 eligible clips respectively. All 936 clips completed paired inference
with zero recorded input failures in run 44282962746. The protocol is timestamped
in Git; it is not a registration in an independent research registry.

Twelve prespecified methods separate calibration, label-support handling and
reliability. The primary comparison is adaptive hierarchy versus the existing
application rule, measured by seven-class macro F1. A calibrated, independently
tuned adaptive zero-padding control tests whether the hierarchy itself adds
value. Secondary comparisons and ablations are descriptive.

Unlike the exploratory study, primary audio reliability counts predictions on
unsupported true categories as errors. Its earlier conditional estimate is
retained as a named ablation. Entropy is excluded from the primary method and
tested separately. These decisions use only the earlier development findings.

`fit` cannot read test actors. It saves temperatures, reliability, validation
traces, selected settings and hashes. The CI test-collection jobs depend on
successful completion of that fit job. `evaluate` loads the fixed artifact;
it cannot tune the parameters. Scores, input failures and complete test outputs
are retained. The paired actor bootstrap and exact actor-block permutation
use actors as clusters, not clips as independent people.

## Related work and positioning

- Guo et al., *On Calibration of Modern Neural Networks*, ICML 2017:
  https://proceedings.mlr.press/v70/guo17a.html — established temperature scaling.
- Tellamekala et al., *COLD Fusion*, IEEE TPAMI 46(2), 805–822, 2024,
  DOI 10.1109/TPAMI.2023.3325770:
  https://arxiv.org/abs/2206.05833v2 — uncertainty-aware fusion of learned
  latent distributions. Literature comparator; not implemented here.
- Ahamed, Saha and Bhushan, *Evaluating early, late, hybrid and meta fusion in
  multimodal emotion detection with pretrained models*, Scientific Reports,
  published 15 September 2026, DOI 10.1038/s41598-026-68674-5:
  https://www.nature.com/articles/s41598-026-68674-5 — directly relevant
  frozen-encoder fusion benchmarking. Generic pretrained fusion is not novel.

A further primary-source review found directly relevant prior art: Li and Lin,
*Integrating Specialized Classifiers Based on Continuous Time Markov Chain*,
IJCAI 2017, https://ijcai.org/proceedings/2017/312 . The mass-preserving rule is
a nested-label special case of their weighted CTMC construction for audio
weight below one; weight one is its continuous limit, not necessarily a unique
stationary solution. The derivation and independent numerical checks are in
`manuscript/paper.md`, `ctmc_check.py` and `test_ctmc_check.py`.

**The core rule is not a novel fusion algorithm.** The paper is being positioned
as an empirical investigation of frozen speech–face experts with nested label
sets. A broader prior-art review, a second dataset and a second expert pair are
still needed before a strong submission claim. This literature finding changes
the interpretation, not the already frozen twelve-method evaluation protocol.

## Completed results (18 November 2026)

All twelve methods were evaluated on the same 416 clips from eight held-out
actors. The prespecified primary improvement hypothesis was **not supported**.

| Method | Accuracy | Macro F1 | NLL | Brier |
|---|---:|---:|---:|---:|
| Face alone | 39.90% | 0.3918 | 2.3984 | 0.9508 |
| Existing fusion | 43.99% | 0.4427 | 2.0952 | 0.7982 |
| Adaptive hierarchy (primary) | 43.99% | 0.4418 | 1.6102 | 0.7262 |

Primary macro-F1 difference: -0.0009; paired actor-bootstrap 95% interval
[-0.0416, 0.0395]; exact two-sided actor-block permutation p=0.9531.
Both fusion methods correctly classified 183 clips. The primary method gained
ten correct predictions on unsupported audio categories and lost ten on shared
categories. Better probability scores did not imply better classification.
This does not establish equivalence or clinical utility.

- [Research manuscript PDF](manuscript/MindSense_Research_Paper.pdf)
- [Editable DOCX](manuscript/MindSense_Research_Paper.docx)
- [Manuscript source](manuscript/paper.md)
- [All results and settings](manuscript/figures/RESULTS.md)
- [Complete evidence](evidence/) and [verification status](verification.json)
- [Original completed run](https://github.com/Mohammadtabrejalam/Emotion-detection-by-using-multi-modal-fusion-mental-health-monitoring./actions/runs/44282962746)

## Reproduction

Recompute the completed study from committed real model scores, without
redownloading videos or checkpoints:

```bash
pip install -r research/fusion_v2/requirements.txt
python -m research.paper_v1.verify_evidence
python -m unittest research.paper_v1.test_study research.paper_v1.test_ctmc_check -v
python -m research.paper_v1.report --results research/paper_v1/evidence/paper-study-evaluation/results.json --fitted research/paper_v1/evidence/fitted-parameters/fitted.json --output research/paper_v1/manuscript/figures
```

The verifier checks input hashes and reproduces fitting, validation selections,
all test metrics, probabilities, uncertainty and stress results. It also checks
the CTMC identity on all 416 held-out probability pairs. This is verification
of one experiment, not a second independent study.

For a fresh end-to-end inference reproduction:

Install `research/fusion_v2/requirements.txt`; inference additionally needs the
main README's CPU inference environment, FFmpeg and pinned audio/image models.

```bash
python -m unittest research.paper_v1.test_study -v
python -m research.paper_v1.collect --actors 7 8 9 10 11 12 13 14 15 16 --output artifacts/paper/development.jsonl
python -m research.paper_v1.study fit --scores artifacts/paper/development.jsonl --output artifacts/paper/fitted.json
# Only after fitting, collect the untouched test actors.
python -m research.paper_v1.collect --actors 17 18 19 20 21 22 23 24 --fitted artifacts/paper/fitted.json --output artifacts/paper/test.jsonl
python -m research.paper_v1.study evaluate --scores artifacts/paper/test.jsonl --fitted artifacts/paper/fitted.json --output artifacts/paper/results.json
```

Collection is resumable by complete record ID; preserve each cache's provenance.
Raw RAVDESS media use CC BY-NC-SA 4.0 and are never committed. Input failures
remain in the record set; results use identical successful pairs across methods.
An interrupted collection is not a finished experiment. After observing test
outcomes, do not retune against these actors or quietly change the split.

## Paper direction

Working title: *When Does Late Fusion Help? Evaluating Frozen Emotion
Classifiers with Partially Overlapping Label Sets*.

The application is a demonstrator, not the main paper contribution. A useful
paper must explain conditions under which fusion helps or harms, including
negative results. The earlier academic report describes the previous exploratory experiment;
the paper manuscript linked above contains the completed expanded study. Physical corruption,
cross-dataset generalization, a second checkpoint pair and measured resource
costs are not covered by this first expanded experiment.

## Paper source and mathematical verification

```bash
python -m unittest research.paper_v1.test_study research.paper_v1.test_ctmc_check -v
# Only after actual results exist:
python -m research.paper_v1.report --results artifacts/paper/results.json --fitted artifacts/paper/fitted.json --output research/paper_v1/manuscript/figures
# Requires Pandoc and python-docx:
python -m research.paper_v1.build_paper
soffice --headless --convert-to pdf --outdir research/paper_v1/manuscript research/paper_v1/manuscript/MindSense_Research_Paper.docx
```

The manuscript incorporates completed evidence but still needs broader validation
and venue-specific author, disclosure and formatting review before submission.
The CTMC checks verify mathematical equivalence on explicit test fixtures; they
do not reproduce the original paper's datasets or headline metrics.
