# Prospective study results

Generated from actual score evidence: 416 accepted pairs / 416 attempted test clips.

| Method | Accuracy | Macro F1 | NLL | Brier | ECE (10 bins) |
|---|---:|---:|---:|---:|---:|
| face | 0.3990 | 0.3918 | 2.3984 | 0.9508 | 0.4159 |
| audio | 0.2284 | 0.1347 | 14.1258 | 1.2696 | 0.5631 |
| legacy | 0.4399 | 0.4427 | 2.0952 | 0.7982 | 0.1142 |
| equal_zero | 0.4062 | 0.3973 | 2.2353 | 0.8258 | 0.1290 |
| calibrated_face | 0.3990 | 0.3918 | 1.6653 | 0.7744 | 0.1823 |
| static_zero | 0.4207 | 0.4246 | 1.6312 | 0.7385 | 0.0894 |
| static_hierarchy | 0.4111 | 0.4066 | 1.6102 | 0.7366 | 0.0699 |
| adaptive_zero | 0.4399 | 0.4463 | 1.6721 | 0.7261 | 0.0654 |
| adaptive_hierarchy | 0.4399 | 0.4418 | 1.6102 | 0.7262 | 0.0930 |
| conditional_hierarchy | 0.4423 | 0.4467 | 1.5931 | 0.7217 | 0.0795 |
| uncalibrated_hierarchy | 0.3990 | 0.3931 | 2.1061 | 0.8690 | 0.3608 |
| entropy_hierarchy | 0.4351 | 0.4412 | 1.5536 | 0.7199 | 0.1026 |

Primary adaptive-hierarchy minus legacy macro F1: **-0.0009**.
Paired actor-bootstrap 95% interval: [-0.0416, +0.0395]; 5000 replicates.
Exact two-sided actor-block permutation p = 0.9531 (256 assignments).

Limited actor population; block exchangeability is assumed. Not clinical or cross-dataset evidence.

## Selected settings

```json
{
  "parameters": {
    "audio_temperature": 4,
    "face_temperature": 2,
    "audio_reliability": [
      0.2692307692307692,
      0.9090909090909091,
      0.21800947867298578,
      0.21739130434782608
    ],
    "conditional_audio_reliability": [
      0.4666666666666667,
      0.9090909090909091,
      0.40707964601769914,
      0.45454545454545453
    ],
    "face_reliability": [
      0.8095238095238095,
      0.6,
      0.44,
      0.38181818181818183,
      0.410958904109589,
      0.5111111111111111,
      0.22950819672131148
    ]
  },
  "selected": {
    "static_zero": {
      "weight": 0.25,
      "gamma": 0
    },
    "static_hierarchy": {
      "weight": 0.5,
      "gamma": 0
    },
    "adaptive_zero": {
      "weight": 0.5,
      "gamma": 0
    },
    "adaptive_hierarchy": {
      "weight": 0.75,
      "gamma": 0
    },
    "conditional_hierarchy": {
      "weight": 0.5,
      "gamma": 0
    },
    "uncalibrated_hierarchy": {
      "weight": 0.25,
      "gamma": 0
    },
    "entropy_hierarchy": {
      "weight": 0.75,
      "gamma": 2
    }
  }
}
```

## Actor results

| Actor | Pairs | Face macro F1 | Legacy macro F1 | Adaptive hierarchy macro F1 |
|---|---:|---:|---:|---:|
| 17 | 52 | 0.4416 | 0.5140 | 0.5403 |
| 18 | 52 | 0.5011 | 0.5103 | 0.5124 |
| 19 | 52 | 0.4346 | 0.5098 | 0.5064 |
| 20 | 52 | 0.3087 | 0.3780 | 0.3128 |
| 21 | 52 | 0.4005 | 0.4691 | 0.3834 |
| 22 | 52 | 0.3881 | 0.4026 | 0.4930 |
| 23 | 52 | 0.2350 | 0.2993 | 0.2697 |
| 24 | 52 | 0.2559 | 0.2498 | 0.2811 |

## Scope

All twelve prespecified methods are reported. The primary comparison and its uncertainty were fixed before test collection. Secondary comparisons remain descriptive. Score mixing is not physical noise testing. One acted dataset and one checkpoint pair do not establish generalization or clinical validity.

Results SHA-256: `f8b1449ee1907a481d0cf3beb9bc7717bf7b3826223c6bae809b5851bf2aa979`
Fitted artifact SHA-256: `8f85229cbf1eba224d49bcb0f78674a6b4996328ebc1c0e9c688cbbb4b448f1f`
