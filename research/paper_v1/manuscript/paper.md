# When Does Late Fusion Help? Evaluating Frozen Emotion Classifiers with Partially Overlapping Label Sets

**Working manuscript — prospective experiment in progress. Not a submission-ready paper.**

Author and institutional details must be confirmed by the student before submission.

## Abstract

Independently trained emotion classifiers can expose different output categories. Combining their scores therefore requires a decision about categories that one classifier cannot express. This study examines a frozen four-class speech classifier and a frozen seven-class facial-expression classifier. We compare conventional score averaging, the existing application's support-based averaging rule, temperature calibration, and a probability-mass-preserving fusion adapter. Reliability weighting and conditional reliability estimates are isolated through ablations. The prospective protocol reserves six RAVDESS actors for fitting, four for validation and eight for testing; six previously examined actors are excluded. All comparisons use identical accepted audiovisual samples, with input failures reported separately. Accuracy, macro F1, calibration, actor-level variation and paired uncertainty estimates are prescribed before test inference. The expanded experiment's numerical results are not yet available in this version. The adapter reduces to an existing CTMC fusion construction in this nested-label setting. No algorithmic novelty, clinical validity or performance advantage is claimed.

## 1. Introduction

A practical multimodal system may reuse models trained by different teams on different datasets. Such models need not predict the same categories. In our case, the speech classifier produces probabilities for happy, sad, angry and neutral, while the face classifier also predicts fear, surprise and disgust. An absent audio category does not mean that the audio establishes that category to be impossible. The classifier simply has no corresponding output.

This distinction matters when combining predictions. Padding the speech distribution with zeros and averaging it with the face distribution reduces the probability assigned to every category missing from speech. Averaging only over modalities that support each category avoids explicit zeros, but its subsequent normalization also changes those categories' total probability. A more careful adapter can retain the face classifier's probability mass for categories outside the speech vocabulary while using speech to redistribute mass within the shared vocabulary.

Preserving that mass is a mathematical property, not a guarantee of more accurate recognition. The face model's mass allocation may itself be wrong. Speech errors may persist after calibration, and reliability learned on a few actors may not generalize. We therefore study the adapter as an empirical hypothesis rather than a new state-of-the-art model.

The application that motivated the study serves as a demonstrator. Its authentication, journaling and dashboard functions are engineering context, not evidence for the research claim. The paper concerns recognition of dataset emotion labels, not diagnosis or measurement of mental illness.

## 2. Related work and research positioning

Temperature scaling is an established calibration method [1]. We use a small fixed temperature grid and make no novelty claim for calibration. COLD Fusion [2] learns latent audiovisual distributions with calibration and ordinal-ranking constraints. It establishes that uncertainty-aware emotion fusion already exists; it is not an implementation-equivalent baseline for our frozen score adapter.

Ahamed et al. [3] compare early, late, hybrid and meta fusion using pretrained encoders on MELD. Consequently, combining frozen pretrained models or comparing fusion strategies is not by itself a new contribution. Our candidate scope is the treatment of partially overlapping output categories in independently trained experts, with a controlled evaluation of what each component contributes.

Li and Lin [7] directly address specialized classifiers whose category sets differ. Their CTMC construction combines class-transition preferences and uses a stationary distribution. This is prior art for the central problem, not merely adjacent multimodal work. Our independent derivation below shows that the mass-preserving rule is a nested-label special case of their weighted construction. We therefore position this work as an empirical study of frozen speech–face fusion, not as the invention of a new fusion algorithm. A useful submission still requires a broader review and evidence beyond this one dataset and checkpoint pair.

The comparisons implemented here are reproducible score-level controls. Results reported in other papers on different datasets, label mappings or subject splits must not be placed in our table as if they were directly comparable. Reimplementing relevant published alternatives under a matched protocol remains further work.

## 3. Research questions

**RQ1:** Does the mass-preserving adaptive adapter outperform the application's existing support-based averaging on unseen actors?

**RQ2:** Does preserving category mass add value beyond calibration and independently tuned ordinary score averaging?

**RQ3:** How much do reliability weighting, excluding unsupported true labels from reliability estimation, and entropy weighting affect the result?

**RQ4:** Are any improvements consistent across actors and probability-quality measures, and what happens when a modality is unavailable or its scores are made less informative?

The primary endpoint is the paired difference in seven-class macro F1 between adaptive hierarchy and the legacy rule. The remaining comparisons are descriptive and cannot be promoted after seeing their outcomes to replace a failed primary comparison.

## 4. Data and frozen experts

RAVDESS contains acted audiovisual expressions from 24 actors and two fixed spoken statements [4]. We use full audiovisual speech clips, exclude calm rather than relabel it, and retain the seven remaining categories. Each actor contributes 52 eligible clips before preprocessing failures: four neutral clips and eight for each other category. Repetitions and intensities from one actor stay in the same partition.

| Partition | Actors | Eligible clips before failures | Purpose |
|---|---|---:|---|
| Excluded development history | 01–06 | Not used | Previously observed results influenced design |
| Fitting | 07–12 | 312 | Temperature and reliability estimation |
| Validation | 13–16 | 208 | Fusion weight and optional entropy selection |
| Test | 17–24 | 416 | One fixed held-out comparison |

These counts describe the protocol, not successful inference coverage. The final evidence table must state attempted and accepted counts separately. The actor split was specified before new collection but is a single fixed partition, not repeated subject cross-validation.

The speech expert is `superb/wav2vec2-base-superb-er`, revision `441a7599c3b22107314dcbd9166621c5c83f2cc5`. Its model card describes the SUPERB IEMOCAP emotion task and 16 kHz input [5]. The facial expert is `trpakov/vit-face-expression`, revision `ef0bc6fc34241b6587e7e009e7711357be28c024`, a ViT model whose card reports FER2013 fine-tuning and seven output categories [6]. Neither checkpoint is retrained in this study. Published model-card metrics are not our evaluation results.

Audio is decoded to mono 16 kHz. The midpoint video frame passes through the existing single-face detector and cropper before model preprocessing. This is a deliberately limited single-frame visual pipeline, not a temporal facial-motion model. The collector records the filename, actor, true category, input SHA-256, checkpoint revisions, probability vectors and any input failure. Both modalities must succeed for a sample to enter a paired comparison. Conditioning on successful face detection can bias the evaluated sample; class and actor coverage must therefore accompany performance.

## 5. Fusion formulation

Let C be the seven-category vocabulary and S the four-category speech vocabulary, with S a subset of C. Let a(c) be the normalized speech distribution on S and v(c) the normalized face distribution on C. Define m = sum over c in S of v(c), and U = C minus S.

### 5.1 Ordinary zero-padded mixture

Extend a with zeros outside S. For audio weight w in [0,1],

\[
q_{zero}(c)=(1-w)v(c)+w\,\tilde a(c).
\]

Its total mass on U equals (1-w)(1-m). At equal weights it halves the face mass outside S, regardless of whether speech contains useful information about those categories.

### 5.2 Existing support-based averaging

The existing rule averages the experts for categories in S, uses the face score alone for U, then normalizes. The pre-normalization total is Z=(3-m)/2. Thus,

\[
q_{legacy}(c)=
\begin{cases}
(v(c)+a(c))/(3-m), & c\in S,\\
2v(c)/(3-m), & c\in U.
\end{cases}
\]

Its mass on U is 2(1-m)/(3-m). This is smaller than 1-m whenever 0<m<1. The rule therefore changes unsupported-category mass even though it does not explicitly pad audio with zeros. This is an algebraic explanation of a possible failure mechanism, not evidence that every prediction becomes worse.

### 5.3 Mass-preserving adapter

We retain the face distribution on U and mix within S:

\[
q_{hier}(c)=
\begin{cases}
(1-w)v(c)+wm a(c), & c\in S,\\
v(c), & c\in U.
\end{cases}
\]

This distribution is nonnegative, sums to one, and preserves both the shared and unsupported total masses. The implementation uses this expression directly, avoiding division by m when m=0. The construction imposes an assumption: the face expert controls the boundary between shared and unsupported categories. It cannot correct an erroneous boundary allocation. It can still change the winning category by concentrating probability within S.

### 5.4 Calibration and reliability

For each expert, temperature transformation is

\[
p_T(c)=p(c)^{1/T}/\sum_j p(j)^{1/T}.
\]

The fitting split selects T from {0.5,1,2,4} by negative log likelihood. Audio temperature fitting uses supported true labels, since the four-class expert has no likelihood for unsupported truths. Values are floored at \(10^{-12}\) for numerical stability.

For predicted class k, a Beta(1,1)-smoothed reliability estimate is

\[
r_k=(1+n_{correct,k})/(2+n_{predicted,k}).
\]

Primary audio reliability includes all fitting samples: an audio prediction on a true unsupported category counts as incorrect. A conditional-reliability ablation estimates it only among supported truths. Reliability is a coarse predicted-class statistic, not a direct measurement of input quality or epistemic uncertainty.

Given a prior audio weight alpha, the adaptive weight is

\[
w(x)=\frac{\alpha r_a(x)}{\alpha r_a(x)+(1-\alpha)r_v(x)}.
\]

The primary method has no entropy term. A secondary ablation multiplies each reliability by \(\max(1-H(p)/\log K,10^{-6})^{\gamma}\), where gamma is chosen from {0,1,2}. A confident distribution can be wrong, so this term must be evaluated rather than treated as a reliability guarantee.

### 5.5 Relationship to existing CTMC fusion

The published construction [7] and the authors' implementation [8] form a weighted sum of class-transition generators. For one full-vocabulary expert and one subset expert, we derive the stationary solution independently. Let q denote the stationary distribution and let the two expert weights be 1-w and w, with w<1. The full expert contributes the vector (1-w)(v-q). The subset expert contributes zero outside S and w(a sum(q_S)-q_S) inside S.

Outside S, stationarity implies q_U=v_U, hence sum(q_S)=m. Inside S it then gives

\[
0=(1-w)(v_S-q_S)+w(ma-q_S),
\qquad q_S=(1-w)v_S+wma.
\]

This is exactly the adapter in Section 5.3. The identity also holds for an input-dependent scalar weight after fixing that input. At w=1, the CTMC need not have a unique stationary distribution because the full expert has no weight; the adapter uses the continuous limit as w approaches one. It should not be described as the unique stationary solution at that endpoint.

An independent NumPy solver checks the identity against stationary equations for deterministic probability fixtures and tests the non-unique endpoint. These are mathematical software checks, not additional emotion-recognition observations. The finding rules out novelty claims for the core mass-preserving rule. Any research value must come from the experimental analysis, justified reliability treatment or another demonstrably distinct contribution.

## 6. Experimental design

Each tunable method independently selects its weight from {0,0.25,0.5,0.75,1} by validation macro F1. The first grid entry wins a tie. The fixed protocol specifies all twelve methods:

| Method | What it tests |
|---|---|
| Raw face | Strong unimodal control |
| Raw audio, padded | Four-class expert under the seven-class task |
| Legacy rule | Existing application's fusion behavior |
| Equal zero-padded average | Conventional equal mixture |
| Calibrated face | Probability calibration alone |
| Static zero-padded mixture | Tuned mixture without hierarchy |
| Static hierarchy | Mass preservation without adaptive reliability |
| Adaptive zero-padded mixture | Reliability and calibration without hierarchy |
| Adaptive hierarchy | Prespecified primary method |
| Conditional-reliability hierarchy | Effect of excluding unsupported audio truths |
| Uncalibrated hierarchy | Effect of temperature scaling |
| Entropy hierarchy | Additional entropy weighting |

The `fit` command reads only fitting and validation actors. It produces selected parameters, the full validation trace, coverage, input hashes and the protocol hash. Test collection in CI depends on successful fitting and requires that artifact. `evaluate` reads it without refitting. The code and protocol were committed at `8734d75bd5a54918b4befd1990a3c592a4edc0a6` before prospective collection.

Accuracy and macro F1 use the fixed seven labels. Confusion matrices and per-class precision, recall and F1 expose category-specific tradeoffs. Probability quality is measured by NLL, multiclass Brier score and ten-bin ECE. Selective accuracy is reported at 50%, 80% and 100% coverage using maximum probability; it does not establish a clinically safe rejection threshold.

The primary interval uses 5,000 paired actor-cluster bootstrap samples with seed 20261117. An exact two-sided actor-block permutation enumerates all 256 assignments of method swaps across eight actors. Both methods operate on actors rather than pretending that repeated clips are independent participants. The permutation interpretation requires block exchangeability; eight actors still provide limited population evidence.

Prespecified stress cases remove audio, remove face, or mix audio scores halfway with a uniform distribution. The last case is score degradation only. It cannot support a claim about microphone noise, occlusion, lighting, sensor failure or real-world robustness.

## 7. Results and interpretation boundary

The prospective experiment is running. Its results must be inserted from the saved fitted artifact and held-out score records after completion. No expanded-study accuracy, F1, uncertainty interval or performance graph is asserted in this draft.

The earlier exploratory study is retained separately in `research/fusion_v2`. It helped choose this protocol and is not an independent validation of the present design. Its outcomes must not be pooled with the new test actors or presented as a second untouched benchmark.

A positive result against the legacy rule alone would not establish that adaptive reliability is necessary, that the method beats a strong matched alternative, or that the behavior generalizes to another dataset. A negative result is reportable: it can identify when preserving face mass is unhelpful or when a weak audio model contributes too little information.

## 8. Limitations and ethics

This experiment uses one acted dataset, one checkpoint pair, one actor partition and a midpoint face image. Statements have little lexical diversity, so adding text emotion classification would not provide a credible three-modal test here. Neutral has fewer samples per actor than the other categories. Emotion labels describe the intended dataset expression, not a participant's private psychological state.

Actor separation protects fitting from these held-out subjects; it does not prove absence of every upstream pretraining overlap. Model cards identify major training sources but do not provide an exhaustive image- or person-level audit. The checkpoint and dataset provenance must remain part of the interpretation.

RAVDESS attribution and its noncommercial share-alike license apply to use of its media. The repository stores score evidence rather than redistributing raw participant videos. No new patient data or private application journals enter this study. The results do not validate depression, anxiety, stress severity or any clinical diagnosis.

Before a strong submission, the work needs a broader prior-art review, a second suitable dataset, another expert pair, matched published baselines where feasible, physical input corruptions and controlled resource measurements. Those extensions require fresh protocols and evaluation data; they cannot be tuned to improve the current held-out result.

## References

[1] C. Guo, G. Pleiss, Y. Sun and K. Q. Weinberger. “On Calibration of Modern Neural Networks.” ICML, PMLR 70, 1321–1330, 2017. https://proceedings.mlr.press/v70/guo17a.html

[2] M. K. Tellamekala et al. “COLD Fusion: Calibrated and Ordinal Latent Distribution Fusion for Uncertainty-Aware Multimodal Emotion Recognition.” IEEE TPAMI 46(2), 805–822, 2024. DOI: 10.1109/TPAMI.2023.3325770. Author version: https://arxiv.org/abs/2206.05833v2

[3] S. R. Ahamed, S. Saha and A. Bhushan. “Evaluating early, late, hybrid and meta fusion in multimodal emotion detection with pretrained models.” Scientific Reports, 2026. DOI: 10.1038/s41598-026-68674-5. https://www.nature.com/articles/s41598-026-68674-5

[4] S. R. Livingstone and F. A. Russo. “The Ryerson Audio-Visual Database of Emotional Speech and Song (RAVDESS): A dynamic, multimodal set of facial and vocal expressions in North American English.” PLoS ONE 13(5), e0196391, 2018. https://doi.org/10.1371/journal.pone.0196391 . Data: https://zenodo.org/records/1188976

[5] SUPERB. “Wav2Vec2-Base for Emotion Recognition.” Model card and checkpoint. https://huggingface.co/superb/wav2vec2-base-superb-er . Exact revision recorded in Section 4 and the protocol.

[6] trpakov. “Vision Transformer (ViT) for Facial Expression Recognition.” Model card and checkpoint. https://huggingface.co/trpakov/vit-face-expression . Exact revision recorded in Section 4 and the protocol.

[7] Z. Li and D. Lin. “Integrating Specialized Classifiers Based on Continuous Time Markov Chain.” IJCAI 2017, 2244–2251. https://doi.org/10.24963/ijcai.2017/312 . Proceedings: https://ijcai.org/proceedings/2017/312

[8] Z. Li. CTMCEnsemble.jl, accompanying implementation, `build` and stationary-distribution functions. https://github.com/innerlee/CTMCEnsemble.jl . Inspected source blob: `ea1b84ee687a6aadce95622ac3ca473759f29e67`.
