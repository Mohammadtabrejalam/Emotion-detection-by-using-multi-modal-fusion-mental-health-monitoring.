# MindSense

A demonstrable expression-analysis application: published text, speech, and facial-image classifiers run locally on the backend, with support-aware late fusion, private journaling, self-reported check-ins, history, and expiring result links.

**Research demonstration, not a mental-health diagnostic system.** Models classify expression patterns; they do not establish internal feelings. Fusion performance varies by actor; the research findings do not establish broad superiority. No random predictions or missing-checkpoint substitutes are served.

## Run locally (Windows PowerShell)

Use Python 3.11 or 3.12, Node.js 22.12+, Git, and FFmpeg on PATH. Run from the repository root. Allow several GB for dependencies and models; a CPU machine with 8 GB RAM is a practical starting point, not a measured minimum.

```powershell
git clone https://github.com/Mohammadtabrejalam/Emotion-detection-by-using-multi-modal-fusion-mental-health-monitoring..git mindsense
cd mindsense
git switch fix/complete-analysis-workflow
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install "torch>=2.6,<3" --index-url https://download.pytorch.org/whl/cpu
python -m pip install -r backend/requirements-inference.txt
Copy-Item .env.example .env
python -m scripts.download_models
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal at the repository root:

```powershell
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to port 8000. API docs: **http://localhost:8000/docs**. For Linux/macOS, use `python3 -m venv .venv`, `source .venv/bin/activate`, and `cp .env.example .env`; the remaining commands are the same. Install FFmpeg with your system package manager and verify `ffmpeg -version`.

For a quicker text-only setup, use `python -m scripts.download_models --modalities text`. Audio/image submissions then explicitly report unavailable checkpoints. Model downloads are pinned to exact revisions; inference uses local files only. Downloading sends no user inputs to model providers.

## Demonstrate the application

1. Open Analyze and check model availability. Enter English text, speech up to 30 seconds, or a clear photo of one consenting adult. Confirm permission and run.
2. Review individual labels, combined scores, and disagreement warnings. Guest results are not saved.
3. Register your own account (no default production credentials). Run another analysis, then open Insights for private history, journal entries, and check-ins.
4. Share a saved result using an expiring public link, then revoke it. Raw inputs and journal entries are not shared.
5. Export data or delete your account in Settings. Clearing history removes analyses and their links while preserving journals/check-ins.

The app guide is a scripted FAQ, not an LLM. Research participation is unavailable unless an operator configures a legitimate study; no institutional approval is implied. The educational emotion game is not a model benchmark.

## Actual evaluation

Committed reports contain individual prediction IDs, source hashes, per-class metrics, and confusion matrices. No raw dataset media is committed.

| Evaluation | Samples | Accuracy | Macro F1 |
|---|---:|---:|---:|
| Text on official MELD test | 2,610 | 43.72% | 0.270 |
| Speech on RAVDESS actor 01, supported labels | 28 | 46.43% | 0.366 |
| Face on RAVDESS actor 01 | 52 | 40.38% | 0.392 |
| Speech + face fusion on actor 01 | 52 | 38.46% | 0.355 |

MELD's majority-neutral baseline is **48.12%**, higher than the text model's accuracy. The text model was trained for GoEmotions, then projected to seven categories; this is a cross-dataset transfer evaluation. This original RAVDESS evaluation uses **one actor only**, excludes calm, and cannot establish population performance. Audio supports four labels; its sample set differs from face/fusion. Fusion underperformed face alone on this subset. Three-way fusion and clinical outcomes have not been benchmarked.

See [model card](MODEL_CARD.md), [evaluation reproduction](docs/EVALUATION_PUBLISHED.md), [deployment](docs/DEPLOYMENT.md), and [readiness report](docs/APPLICATION_READINESS.md), and [interview guide](docs/INTERVIEW_GUIDE.md).

## Tests

```text
python -m pytest backend/tests -q
cd frontend
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

API tests use explicitly test-only classifier doubles to verify contracts, ownership, and storage; those results are not model accuracy. The separate evaluation script uses actual installed checkpoints. Browser tests use an isolated database and real HTTP endpoints, with a real-model path when text weights are installed.

## Architecture and scope

React/Vite → FastAPI → local Transformers models → label mapping/late fusion → SQLite for signed-in results. The server performs inference, not the browser. One CPU worker is the supported baseline; inference is serialized to bound model memory. See [architecture](ARCHITECTURE.md).

The older `backend/app/ml` cross-attention training and dataset pipelines remain research scaffolding. Historical `PHASE_*` documents and synthetic experiment artifacts do **not** describe the serving models or provide evidence of real model performance. The application no longer reads their claimed metrics. No jointly trained multimodal checkpoint was fabricated.

## Academic report and fusion investigation

The [academic report](docs/ACADEMIC_REPORT.md) documents the implemented models, fusion mathematics, recomputed MELD/Actor 01 metrics, genuine browser evidence and study limitations. Run `python -m scripts.verify_report_evidence` to verify the saved prediction metrics without downloading models.

The actor-separated follow-up includes 260 real audiovisual clips, frozen experts, seven methods and a 104-clip test shared by all methods. Adaptive class reliability reaches 52.88% accuracy and 0.5148 macro F1 versus 50.00% and 0.4933 for existing fusion. Actor-level and calibration findings are mixed; the two-actor interval crosses zero. This reproduces a previously observed experiment and is not fresh independent validation. See [scores, methods and limitations](research/fusion_v2/README.md), [PDF report](docs/MindSense_Academic_Report.pdf), [Word report](docs/MindSense_Academic_Report.docx) and [report reproduction](docs/report_source/README.md). No algorithmic novelty or clinical validity is claimed.

