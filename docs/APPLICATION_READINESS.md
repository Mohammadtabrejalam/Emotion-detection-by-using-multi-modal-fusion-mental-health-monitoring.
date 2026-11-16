# MindSense application readiness — 16 November 2026

## Scope delivered

This change repairs the existing application workflow. It does not claim completion of the research experiments or validated emotion recognition.

- Missing or invalid serving checkpoints fall back to explicitly labeled rule-based demonstration, never uninitialized model weights.
- The analysis UI labels demo results and distinguishes illustrative scores from validated model confidence.
- Microphone recordings preserve the actual browser MIME type and file extension. WebM and MP4 audio are accepted by the API; FFmpeg is needed to decode them.
- Empty text and corrupted audio are rejected. Audio/image uploads are limited to 10 MB each. FFmpeg subprocesses time out after 30 seconds.
- Stereo PCM WAV samples are normalized before downmixing, preserving their amplitude scale.
- Guest-supplied user IDs cannot write analyses/check-ins into registered accounts.
- Private result share creation and revocation require the result owner's session.
- Journal read/save/delete requests send the authentication token expected by the backend.
- Check-in scores must be between 1 and 5.
- Backend tests use a temporary SQLite database and independent rate-limit state.

## Running locally on Windows

Use Python 3.11+ and Node.js 22.12+ (the frontend uses Vite 8). Install FFmpeg and put it on PATH for compressed audio and microphone recordings. Standard PCM WAV uploads can use SciPy directly.

From the repository root, in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload
```

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. The API documentation is at http://localhost:8000/docs.

The app works as a rule-based demonstration without a serving checkpoint. To select a compatible checkpoint, set the environment variable before starting the backend:

```powershell
$env:MINDSENSE_MODEL_PATH = 'C:\models\mindsense_fusion.pt'
```

This must be a state dictionary compatible with `backend/app/ml/fusion_model.py` and its text/audio/image preprocessing, with label order `happy, sad, angry, fear, surprise, disgust, neutral`. The E04 research architecture is separate; pointing this variable to an arbitrary research checkpoint does not integrate that model into serving. A synthetic checkpoint is still not evidence of emotion-recognition accuracy.

Optional configuration:

- `MINDSENSE_DATABASE_PATH`: absolute path to a SQLite database (parent directory must exist).
- `JWT_SECRET_KEY`: signing key actually consumed by the backend.
- `ALLOWED_ORIGINS`: comma-separated browser origins.
- Frontend `VITE_API_BASE_URL`: API prefix, default `http://localhost:8000/api`.

Environment files are not automatically loaded by the backend. Set process environment variables explicitly. The legacy root `.env.example` contains settings that the application does not implement, including PostgreSQL configuration.

## Verification

Run from the repository root:

```powershell
python -m pytest backend/tests -q
cd frontend
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

External-data tests report skips if their real media are absent. The E04 checkpoint-integrity check also reports a skip when its external artifact is not installed, retaining its SHA-256 assertion when present. Require that artifact for research verification with:

```powershell
$env:MINDSENSE_REQUIRE_RESEARCH_ARTIFACTS = '1'
python -m pytest backend/tests/test_fusion_concat.py -k e04_checkpoint_integrity
```

This strict command fails on the current checkout because `artifacts/E04_Multimodal_Fusion_Frozen/best_model.pt` is missing. Skipped tests do not count as scientific validation.

### Results in this environment

- Backend: 123 passed, 5 skipped (external data/checkpoint prerequisites).
- Frontend: 8 tests passed; TypeScript and production build passed.
- Frontend lint: exits successfully with pre-existing React warnings.
- Browser E2E: blocked before test execution by Chromium process restrictions.
- Production build warns that its main JavaScript chunk exceeds 500 kB.

## Remaining prerequisites for full completion

1. Supply the authorized research datasets and the actual trained checkpoints. The repository contains phase reports, but the current checkout cannot independently reproduce all their reported results.
2. Complete the IEMOCAP cross-dataset evaluation described in `PHASE_6_PROTOCOL.md`, including reproducible metrics and artifacts. Do not substitute synthetic metrics.
3. Integrate the selected research model with the serving model's preprocessing and label contract, then evaluate it on held-out real data.
4. Run Playwright on a host where Chromium can launch. This environment blocked browser startup (`socket() failed: Operation not permitted`), so browser end-to-end behavior has not been verified here.
5. Before public deployment, harden the existing development authentication flows: remove seeded demo/admin credentials, replace the default JWT signing key, migrate unsalted password hashes, and deliver reset/verification tokens privately instead of returning them in public API responses. Guest records currently share a public demo workspace. Use synthetic guest inputs only.

No public deployment, research-data acquisition, or medical validation is included in this change.
