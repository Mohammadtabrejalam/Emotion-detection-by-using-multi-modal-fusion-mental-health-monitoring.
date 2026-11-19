FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 ENVIRONMENT=production MINDSENSE_DATABASE_PATH=/data/mindsense.db MINDSENSE_MODELS_DIR=/models MINDSENSE_STATIC_DIR=/app/static
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libglib2.0-0 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/requirements*.txt ./backend/
RUN pip install --no-cache-dir 'torch>=2.6,<3' --index-url https://download.pytorch.org/whl/cpu && pip install --no-cache-dir -r backend/requirements-inference.txt
COPY backend ./backend
COPY scripts ./scripts
COPY reports ./reports
COPY --from=frontend /build/dist ./static
RUN useradd -u 10001 -m mindsense && mkdir -p /data /models && chown mindsense /data /models
USER mindsense
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')"
CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
