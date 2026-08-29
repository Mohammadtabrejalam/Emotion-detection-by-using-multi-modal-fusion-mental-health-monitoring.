# MindSense — Multimodal Emotion & Mental Health Monitoring System

MindSense is a full-stack web application designed for research and longitudinal wellness tracking. It leverages written text, voice acoustics, and facial micro-expressions to estimate user emotional states.

The platform uses a custom **PyTorch Multimodal Fusion Transformer** featuring dynamic modality masking to support arbitrary combinations of inputs (e.g. Text-only, Text + Audio, Audio + Image, or all three) without introduction of zero-biasing artifacts.

---

## 1. Safety & Diagnostic Advisory

> [!WARNING]
> **This system is for research and wellness monitoring only and does not provide medical diagnosis or professional mental-health assessment.**
> 
> * MindSense does **not** evaluate clinical conditions (like clinical depression or anxiety disorders).
> * The emotional estimations are AI-generated models and are not diagnostic thresholds.
> * In case distress thresholds are met, the application provides references to professional crisis helplines (988 Lifeline).

> [!NOTE]
> **Research & Empirical Status (Phase 0 Foundation)**: Current machine learning models and metrics in the codebase represent **provisional development baselines** (trained on synthetic tensors for software verification). **Experimental results pending real-dataset evaluation.** Formal research specifications and evaluation protocols are documented in the `docs/` directory.

---

## 2. Directory Layout

The workspace is organized into modular directories:

```
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI Web Server Routing
│   │   ├── database.py             # SQLite Schemas and CRUD functions
│   │   └── ml/
│   │       ├── mindsense_fusion.pt # Prototype PyTorch state dict weights (synthetic baseline)
│   │       ├── evaluation_results.json # Provisional prototype metrics (pending real-dataset evaluation)
│   │       ├── text_encoder.py     # Unimodal Text PyTorch model
│   │       ├── audio_encoder.py    # Unimodal Audio PyTorch model
│   │       ├── vision_encoder.py   # Unimodal Vision PyTorch model
│   │       ├── fusion_model.py     # Cross-attention Fusion PyTorch Transformer
│   │       └── preprocessing/      # Modality converters (MFCC/Haar face crops)
│   ├── tests/                      # Pytest unit and integration tests
│   └── requirements.txt            # Python library requirements
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Sidebar and UI wrapper panels
│   │   ├── pages/                  # Home, Workspace, History, Trends, Research tabs
│   │   ├── services/               # fetch API networking wrappers
│   │   ├── types.ts                # TypeScript interfaces
│   │   ├── index.css               # Main styling rules with Tailwind CSS v3
│   │   └── App.tsx                 # Main layout routing mount
│   └── tailwind.config.js          # Tailwind CSS configurations
│
├── ARCHITECTURE.md                 # Intermediate fusion transformer architecture details
├── MODEL_CARD.md                   # Model evaluation, training parameters, and biases
├── DATASET.md                      # Feature mapping and subject split leak preventions
└── EXPERIMENTS.md                  # Ablation study comparison reports
```

---

## 3. Installation & Local Execution

Follow these steps to run both the FastAPI API and the React + Vite development servers locally.

### Prerequisites
* **Python 3.10+** (with `pip`)
* **Node.js 18+** (with `npm`)
* **FFmpeg** (optional: required for converting browser recorded audio formats like `.webm` to `.wav`. If unavailable, standard WAV file uploads are handled natively).

---

### Step A: Start Python FastAPI Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install all required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: If PyTorch (`torch`) is not installed or loading is slow on your CPU/GPU hardware, the FastAPI server will automatically load in **Demo Mode**, utilizing a rules-engine simulator to process features without failing.*

3. Execute the Uvicorn web server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend server will run at `http://localhost:8000`. You can inspect the interactive OpenAPI/Swagger documentation at `http://localhost:8000/docs`.

---

### Step B: Start React + Vite Frontend

1. Navigate to the `frontend/` directory (open a separate terminal window):
   ```bash
   cd frontend
   ```

2. Install Node packages:
   ```bash
   npm install
   ```

3. Launch the local dev server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173` (or the address printed in the terminal) to access the MindSense platform.

---

## 4. Running Automated Tests

A comprehensive suite of 13 unit and integration tests is located in the `backend/tests/` folder. It tests text tokenization, face cropping bounding calculations, MFCC spectrogram inputs, and API endpoint responses.

To execute tests:
1. Ensure you are in the `backend` environment.
2. Install pytest if not already loaded:
   ```bash
   pip install pytest httpx
   ```
3. Run the test suite:
   ```bash
   python -m pytest tests/
   ```
