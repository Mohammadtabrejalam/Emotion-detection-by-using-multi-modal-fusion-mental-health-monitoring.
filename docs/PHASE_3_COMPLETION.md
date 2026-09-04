# Phase 3 Completion Report — Multimodal Fusion

## 1. Objective

Phase 3 evaluated multimodal emotion recognition using Text, Audio, and Vision modalities with a Transformer-based fusion architecture.

The experiments were performed on the MELD dataset using the existing Phase 2 unimodal encoders.

## 2. Fusion Architecture

The multimodal fusion model combines 64-dimensional embeddings from:

- Text encoder
- Audio encoder
- Vision encoder

The three modality embeddings are stacked and augmented with learnable modality embeddings. Multi-head self-attention with 4 attention heads is then applied.

The architecture supports modality masking through a modality availability mask. Masked modalities are isolated from cross-modal attention and excluded during mask-aware pooling.

The classifier consists of:

Linear(64 → 32) → ReLU → Dropout → Linear(32 → 7)

## 3. Dataset

Dataset: MELD

Total utterances: 13,708

Splits:

- Train: 9,989 records
- Validation: 1,109 records
- Test: 2,610 records

One corrupted training media sample was excluded during training, resulting in 9,988 valid training samples.

The test set contained 2,610 valid held-out records with no exclusions.

## 4. Phase 2 Unimodal Baselines

| Modality | Accuracy | Macro-F1 | Weighted-F1 |
|---|---:|---:|---:|
| Text | 20.61% | 0.1724 | 0.2035 |
| Audio | 29.85% | 0.2191 | 0.3337 |
| Vision | 23.95% | 0.1096 | 0.2432 |

Macro-F1 is treated as the primary comparison metric because MELD has substantial class imbalance.

## 5. E04 — Frozen-Backbone Multimodal Fusion

Experiment ID: E04_Multimodal_Fusion_Frozen

The Phase 2 encoders were loaded with their parameters frozen while the fusion module was trained.

Best validation Macro-F1: 0.2608

Best epoch: 10

Test results:

| Metric | Result |
|---|---:|
| Accuracy | 30.11% |
| Macro-F1 | 0.2353 |
| Weighted-F1 | 0.3330 |
| Macro-Precision | 0.2520 |
| Macro-Recall | 0.2714 |
| Test samples | 2,610 |

E04 was the strongest complete multimodal fusion model evaluated in Phase 3.

## 6. E05 — Fine-Tuned-Backbone Multimodal Fusion

Experiment ID: E05_Multimodal_Fusion_FineTuned

The Phase 2 encoder parameters were allowed to update during fusion training.

Best validation Macro-F1: 0.2378

Best epoch: 11

Test results:

| Metric | Result |
|---|---:|
| Accuracy | 28.28% |
| Macro-F1 | 0.2166 |
| Weighted-F1 | 0.3058 |
| Macro-Precision | 0.2305 |
| Macro-Recall | 0.2501 |
| Test samples | 2,610 |

E05 performed worse than E04 on the held-out test set.

Macro-F1 difference:

0.2166 - 0.2353 = -0.0187

The training behavior showed evidence of overfitting: training loss continued to decrease while validation loss increased substantially.

## 7. Modality Ablation Study

The seven configurations were evaluated using inference-time modality masking with the E04 checkpoint.

These experiments were evaluation-only; separate models were not trained for each configuration.

| Configuration | Accuracy | Macro-F1 | Weighted-F1 |
|---|---:|---:|---:|
| Text | 21.61% | 0.1709 | 0.2338 |
| Audio | 20.15% | 0.1805 | 0.2202 |
| Vision | 2.76% | 0.0256 | 0.0148 |
| Text + Audio | 29.96% | 0.2401 | 0.3240 |
| Text + Vision | 22.45% | 0.1766 | 0.2544 |
| Audio + Vision | 20.54% | 0.1829 | 0.2403 |
| Text + Audio + Vision | 30.08% | 0.2352 | 0.3326 |

## 8. Main Findings

1. Text + Audio produced the highest Macro-F1 among the seven inference-time modality configurations: 0.2401.

2. The full Text + Audio + Vision configuration achieved Macro-F1 of 0.2352, slightly below Text + Audio at 0.2401.

3. Adding Vision to Text + Audio therefore did not improve Macro-F1 in this experiment.

4. The full three-modality configuration produced the highest accuracy among the ablation configurations at 30.08%, but this was only marginally higher than Text + Audio at 29.96%.

5. Vision-only performance was substantially weaker than the other modality configurations.

6. Fine-tuning all backbones in E05 reduced held-out Macro-F1 compared with frozen-backbone E04.

7. The results demonstrate that simply adding more modalities does not guarantee better balanced-class performance.

## 9. Class-Imbalance Consideration

MELD contains substantially different class frequencies. In the E04 test set, surprise had 1,256 samples, while happy had 50 and sad had 68.

Consequently, Weighted-F1 and accuracy can be influenced strongly by majority classes.

Macro-F1 is therefore retained as the primary metric for comparing models and modality configurations.

## 10. Reproducibility

Primary dataset: MELD

Random seed: 42

Fusion optimizer: AdamW

Learning rate: 0.001

Weight decay: 0.0001

Loss: weighted CrossEntropyLoss using training-set class weights

Fusion embedding dimension: 64

Attention heads: 4

E04 batch size: 32

Ablation batch size: 16

E04 backbones: frozen

E05 backbones: fine-tuned

Test set was used only for final evaluation and ablation analysis.

## 11. Phase 3 Conclusion

Phase 3 successfully implemented and evaluated multimodal Transformer-based fusion, pretrained backbone integration, modality masking, frozen versus fine-tuned fusion, and systematic seven-configuration modality ablation.

The strongest observed Macro-F1 was 0.2401 from the Text + Audio inference-time configuration using the E04 fusion model.

Phase 3 is therefore complete.

The findings motivate the next phase: systematic robustness evaluation under missing modalities.
