# Explain MindSense accurately in an interview

“I built a full-stack demonstration that compares emotion-expression classifiers across text, speech, and facial images. React collects consented inputs; FastAPI validates them, runs published PyTorch models locally, and combines available scores. Authenticated users can keep private results, journal entries, and check-ins. I also implemented owner-scoped data access, expiring share links, account export/deletion, and reproducible model downloads and evaluation.”

Be explicit: you integrated existing trained models; you did not train a new foundation model or prove clinical effectiveness. The deployed architecture is late fusion, not the historical cross-attention prototype.

- **Why multimodal?** Different inputs provide different expression cues. More modalities do not guarantee better accuracy: the measured audiovisual baseline underperformed image-only on the small test subset.
- **Why late fusion?** It enables independently trained models with different labels and missing inputs. The tradeoff is that the model cannot learn interactions jointly, and the scores are uncalibrated.
- **Why published models?** Missing original checkpoints could not support credible inference. Exact revisions, local-only loading and explicit installation errors make provenance and failure behavior inspectable.
- **Why SQLite/one worker?** Simple local operation and a clear ownership model. This choice limits concurrency and requires a different storage/rate-limiting architecture for multiple replicas.
- **What did evaluation reveal?** Text transfer to MELD was below its majority-class baseline; the one-actor RAVDESS diagnostic cannot establish population performance. Use the current reports for exact numbers and explain the differing label spaces.
- **What would you improve next?** Evaluate a larger speaker-independent dataset, select calibration/fusion weights on a separate development set, benchmark held-out aligned three-way data, and measure target-host latency/memory. Never tune on the reported test split.
- **What is the strongest engineering evidence?** Real checkpoint API integration tests, ownership/session regression tests, browser journeys, reproducible evaluation reports, and CI container checks. Distinguish each type of evidence from model accuracy.
