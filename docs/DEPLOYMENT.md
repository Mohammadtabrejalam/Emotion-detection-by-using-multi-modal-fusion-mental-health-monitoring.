# Local and deployment setup

Start with README.md. Copy `.env.example` at the repo root and run commands there. Python dotenv loads that file before database/model configuration. Node 22 and Python 3.11/3.12 are the supported setup targets. FFmpeg is required for compressed audio and browser recordings. CPU PyTorch avoids unnecessary CUDA downloads. Models occupy approximately 1.2 GB, excluding dependencies/cache.

## Configuration

- `MINDSENSE_DATABASE_PATH`: writable SQLite path; default backend database location. Use a new database for demonstrations, not one containing old seeded credentials or personal records.
- `MINDSENSE_MODELS_DIR`: downloaded text/audio/image folders; trusted local files only.
- `JWT_SECRET_KEY`: at least 32 random characters; required with `ENVIRONMENT=production`. Generate using `python -c "import secrets; print(secrets.token_hex(32))"`.
- `ALLOWED_ORIGINS`: explicit comma-separated browser origins. For separate hosting, set frontend build-time `VITE_API_BASE_URL` to the backend's full `/api` URL.
- `MINDSENSE_PRELOAD_MODELS=1`: fail startup when any model is missing/corrupt; use for complete demonstrations.
- `MINDSENSE_STATIC_DIR`: built frontend directory for same-origin hosting.
- `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_FROM`, `SMTP_USERNAME`, `SMTP_PASSWORD`: optional STARTTLS email for recovery/verification. Without email, recovery is explicitly unavailable. Delivery has not been tested against a live provider.
- Never enable `MINDSENSE_TEST_MODE` outside automated tests. Never commit `.env`, database files, tokens, or downloaded models.

## Docker

Download models on the host first. Set `JWT_SECRET_KEY` in root `.env`, then:

```text
docker compose build
docker compose up -d
docker compose logs -f
```

Open http://localhost:8000. Compose binds localhost by default; the image serves frontend and API together, runs as UID 10001, and uses one Uvicorn worker. SQLite uses the named `mindsense-data` volume; model files are mounted read-only. Configure SMTP explicitly in compose if needed. Do not bake secrets or model weights into images. The workspace lacks Docker; GitHub Actions builds the image and exercises container startup, frontend, API health and explicit missing-model errors. Check the PR run for its latest outcome. Test model-volume permissions on your target host before deployment.

For public hosting, put a TLS reverse proxy in front, restrict request sizes and rate limits, set exact origins, and use encrypted storage with an explicit backup/deletion policy. Run one instance with SQLite and the in-memory limiter. Multiple workers/replicas require a coordinated database, rate limiter, and inference service. Provision resources based on measured latency and memory on your target machine; no load/SLA claim is made.

Optional developer administrator creation is local and interactive: `python -m scripts.create_admin`. There are no shipped production passwords. Protect developer administration separately from public user accounts.

## Upgrade and rollback

Back up SQLite before upgrading; startup adds missing columns, but no production migration rollback is provided. Existing synthetic records are not evidence and old seeded accounts should be removed or use a fresh database. Keep the previous code revision and a matching database backup for rollback. Rotate secrets if previously exposed. Revoking a share link cannot retract screenshots/downloads already made by recipients.

No merge, production deployment, external SMTP message, or cloud resource creation was performed as part of these changes.
