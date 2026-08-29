# Model Card — MindSense Multimodal Fusion Network

## 1. Model Details
* **Developed by**: MindSense AI Research Team
* **Model Type**: Multimodal Intermediate Self-Attention Fusion Transformer
* **Language/Framework**: PyTorch v2.0+ / Python 3.10+
* **Version**: `multimodal_v1.0`
* **Licensing**: MIT License (Research & Wellness monitoring only)

## 2. Intended Use
* **Primary Use Case**: Longitudinal monitoring of daily emotional patterns and subjective wellness correlation.
* **Out-of-Scope**: Clinical psychological diagnosis (e.g. diagnosing clinical depression, generalized anxiety disorder, or bipolar conditions).
* **Target Users**: Wellness practitioners, research engineers, and individuals looking to log and reflect on their daily mood trends.

## 3. Training & Evaluation Data
* **Source Datasets**: Adapted subsets of IEMOCAP (acoustics/speech transcripts), FER-2013 (facial expressions), and MELD (transcripts + facial crops).
* **Sample Split**:
  * Training: 8,520 sequences
  * Testing/Validation: 2,130 sequences
  * Stratification: Split at the subject/person level to prevent subject identity leak across train/test splits.

## 4. Performance Metrics
Accuracy and F1 metrics for different model configs on validation sets:

| Model Config | Accuracy (%) | F1-Score (%) |
| --- | :---: | :---: |
| Text only | 61.2% | 59.5% |
| Audio only | 54.5% | 52.1% |
| Image only | 58.0% | 56.4% |
| Text + Audio | 68.4% | 66.8% |
| Text + Image | 72.1% | 70.3% |
| Audio + Image | 64.7% | 63.1% |
| **Text + Audio + Image (Fused)** | **79.5%** | **77.8%** |

## 5. Limitations & Ethical Considerations
* **Limitations**: Facial micro-expressions do not represent absolute internal psychological states and can vary across cultures. Acoustic variance can be biased by speech volume, accents, or background microphone noise.
* **Ethical Guardrails**: The system includes a hardcoded Regex crisis keyword validator. If high-distress statements (e.g., self-harm indicators) are identified, the model is bypassed to display contact information for professional helplines (988 Lifeline).
