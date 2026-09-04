# Phase 4 Completion Report — Missing-Modality Robustness

## Objective

Evaluate the robustness of the multimodal emotion recognition system when one or more modalities are unavailable at inference time.

The experiment evaluates the E04 frozen-backbone multimodal fusion model on the MELD test split under controlled modality-missing conditions.

## Dataset

Dataset: MELD

Test samples:
- Total records: 2,610
- Valid records: 2,610
- Excluded records: 0

Modalities:
- Text
- Audio
- Vision

Number of emotion classes: 7

## Model

Experiment checkpoint:

`artifacts/E04_Multimodal_Fusion_Frozen/best_model.pt`

Model:
- Multimodal Transformer Fusion
- 3 modality embeddings
- Multi-head attention
- Mask-aware pooling
- 7-class classifier
- Phase 2 pretrained unimodal backbones
- Backbones frozen during E04 training

Evaluation device:

`CUDA — NVIDIA GeForce RTX 2050 4 GB`

Random seed:

`42`

## Missing-Modality Evaluation

Random missingness was applied independently to each modality at the specified probability.

### Random Missingness Results

| Missing Rate | Accuracy | Macro-F1 | Weighted-F1 |
|---|---:|---:|---:|
| 0% | 30.08% | 0.2352 | 0.3326 |
| 10% | 28.81% | 0.2296 | 0.3207 |
| 25% | 25.63% | 0.2055 | 0.2941 |
| 50% | 19.08% | 0.1692 | 0.2288 |
| 75% | 12.18% | 0.1282 | 0.1557 |

The results show progressive degradation as the probability of modality loss increases.

Relative to the 0% missing baseline:

- 10% missing: Macro-F1 decreases by 0.0056
- 25% missing: Macro-F1 decreases by 0.0297
- 50% missing: Macro-F1 decreases by 0.0660
- 75% missing: Macro-F1 decreases by 0.1070

## Modality-Specific Missingness

Each condition removes one modality while retaining the other two.

| Condition | Accuracy | Macro-F1 | Weighted-F1 |
|---|---:|---:|---:|
| Text missing | 20.54% | 0.1829 | 0.2403 |
| Audio missing | 22.45% | 0.1766 | 0.2544 |
| Vision missing | 29.96% | 0.2401 | 0.3240 |

Relative to the full-modality baseline:

- Removing text decreases Accuracy by 9.54 percentage points.
- Removing audio decreases Accuracy by 7.63 percentage points.
- Removing vision decreases Accuracy by 0.12 percentage points.

The vision-missing condition does not produce a meaningful performance decrease in this experiment. This indicates that the current fusion model receives substantially more useful predictive information from text and audio than from vision on this MELD evaluation.

This observation should not be interpreted as proof that vision is universally uninformative. It is specific to the current model, preprocessing pipeline, and MELD evaluation.

## Single-Modality Evaluation

| Available Modality | Accuracy | Macro-F1 | Weighted-F1 |
|---|---:|---:|---:|
| Text only | 21.61% | 0.1709 | 0.2338 |
| Audio only | 20.15% | 0.1805 | 0.2202 |
| Vision only | 2.76% | 0.0256 | 0.0148 |

The single-modality results further demonstrate that the current vision representation is substantially weaker than the text and audio representations for this task.

## Robustness Interpretation

The model is not invariant to missing modalities.

Performance remains relatively close to baseline at 10% missingness, but degradation becomes increasingly pronounced at 25%, 50%, and 75% missingness.

At 75% independent modality missingness:

- Accuracy falls from 30.08% to 12.18%.
- Macro-F1 falls from 0.2352 to 0.1282.
- Weighted-F1 falls from 0.3326 to 0.1557.

Therefore, the current E04 fusion model is sensitive to severe modality loss.

The modality-specific experiment indicates:

1. Text is the most important modality among the three under single-modality removal.
2. Audio is also important to the fused prediction.
3. Vision contributes comparatively little to the current MELD result.
4. Combining text and audio provides substantially stronger performance than relying on vision alone.

## Experimental Design Notes

The random missingness probability is applied independently to each modality.

Therefore, a 50% missingness setting means approximately 50% of all modality slots are removed, rather than exactly 50% of samples losing one modality.

At high missingness rates, samples in which all three modalities are unavailable can occur. The fusion implementation supports this condition through its mask-aware handling.

The experiment is inference-only. No model parameters were updated during missing-modality evaluation.

## Automated Verification

Phase 4 test suite:

`backend/tests/test_missing_modality.py`

Result:

`11 passed in 2.92s`

The tests verify:

- modality definitions
- missing-mask shape
- deterministic mask generation
- valid mask values
- approximate missing-rate correctness
- possibility of all modalities being missing
- zero-filling of missing modalities
- preservation of available modalities
- text-missing condition
- audio-missing condition
- vision-missing condition

## Artifacts

Primary results:

`artifacts/missing_modality/missing_modality_results.json`

Primary source implementation:

`backend/app/ml/fusion/missing_modality.py`

Automated tests:

`backend/tests/test_missing_modality.py`

## Phase 4 Conclusion

Phase 4 — Missing-Modality Robustness is complete.

The experiment establishes a measurable relationship between modality availability and multimodal emotion-recognition performance.

The model performs best when all modalities are available and progressively degrades as random modality loss increases.

Text and audio provide substantially more useful information than vision in the current MELD setup, while severe modality loss significantly reduces performance.

These findings provide the robustness baseline required before evaluating model uncertainty and confidence in Phase 5.
