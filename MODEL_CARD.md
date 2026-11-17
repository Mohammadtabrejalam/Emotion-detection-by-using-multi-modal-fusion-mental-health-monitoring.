# Serving model card: published-late-fusion-v1

The [actor-separated fusion study](research/fusion_v2/README.md) evaluates a separate experimental adapter. Its small aggregate gain and mixed actor/calibration findings do not change this serving model or establish broad superiority. The full academic report is under `docs/ACADEMIC_REPORT.md`.

MindSense uses existing trained models, not a newly trained multimodal network. Pinned model revisions and declared model licenses are in `backend/app/inference/registry.py`; downloads preserve model cards and a SHA256 weight manifest. Review upstream dataset and model terms before redistribution or commercial use.

| Input | Published checkpoint | Declared model license | Serving contract |
|---|---|---|---|
| Text | [SamLowe/roberta-base-go_emotions](https://huggingface.co/SamLowe/roberta-base-go_emotions) | MIT | English RoBERTa; 28 sigmoid scores; first 256 tokens |
| Speech | [superb/wav2vec2-base-superb-er](https://huggingface.co/superb/wav2vec2-base-superb-er) | Apache-2.0 | IEMOCAP-trained Wav2Vec2; happy/sad/angry/neutral; 16 kHz |
| Face | [trpakov/vit-face-expression](https://huggingface.co/trpakov/vit-face-expression) | Apache-2.0 | FER2013-trained ViT; seven labels; one Haar-detected face |

The exact seven text groups are executable in the registry. The adapter takes the maximum sigmoid score within each group, then normalizes. For speech/image, model class names map to canonical labels. For each class, fusion averages scores across only the supplied modalities that support that class, then normalizes. This intentionally simple heuristic is neither trained nor calibrated. Missing modalities are omitted entirely; a failed requested modality fails the analysis instead of silently substituting an output.

All model loads use local files, no remote custom code, evaluation mode, and inference mode. Missing/corrupt files produce explicit errors. Audio accepts 0.1–30 seconds; the detector rejects zero/multiple faces; each upload is limited to 10 MB and images to 12 MP. These filters can reject legitimate input and have not been fairness-audited.

## Evidence and limits

See `reports/evaluation.json` for measured summaries and `reports/meld_text.json`, `reports/ravdess_actor01.json` for complete prediction audits. MELD text accuracy is 43.72%, below its 48.12% majority baseline. The actor-01 RAVDESS audiovisual fusion result is 38.46%, below image-only 40.38%. Do not claim multimodal superiority. No clinical, demographic fairness, multilingual, real-time-streaming, three-way aligned, or population-level validation has been performed. A model's published model-card metrics are not this application's measurements.

Intended use: an engineering demonstration and educational exploration of expression classifiers. Out of scope: diagnosis, treatment, crisis triage, employee/student monitoring, consequential decisions, or claims about an individual's internal emotional state. Journals/check-ins are user-reported reflections, not AI assessments.

No task-specific fine-tuning was performed here. Existing cross-attention experiments remain separate; their original checkpoint and research protocol are not completed by installing these published models.
