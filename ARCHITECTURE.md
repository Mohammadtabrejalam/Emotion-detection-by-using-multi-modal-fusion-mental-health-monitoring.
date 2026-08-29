# MindSense System Architecture Specification

## Overview
MindSense is a research-oriented affective platform designed to process, analyze, and fuse multimodal signals (text, speech audio, and visual facial crops) for computational emotion estimation.

```
                  ┌─────────────────────────────────────────┐
                  │          Public User Frontend           │
                  │   (React 19, TypeScript 5, Vite 8)      │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS / JSON / FormData
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │            FastAPI Gateway              │
                  │     (JWT Auth, Rate Limiting, RBAC)     │
                  └──────┬───────────────────┬──────────────┘
                         │                   │
      ┌──────────────────┴──┐             ┌──┴──────────────────┐
      │  PyTorch Multimodal │             │ Cloudinary Backend  │
      │   Fusion Engine     │             │ Media Storage API   │
      └──────────────────┬──┘             └──┬──────────────────┘
                         │                   │
                         └─────────┬─────────┘
                                   ▼
                  ┌─────────────────────────────────────────┐
                  │          PostgreSQL Database            │
                  │       (SQLAlchemy 2.0, Alembic)         │
                  └─────────────────────────────────────────┘
```

## Architectural Principles
1. **Architectural Separation**: The public user application and developer portal operate in strict isolation.
2. **Backend Media Mediation**: Browser applications upload files directly to FastAPI. FastAPI validates file size, extension, MIME type, and safely dispatches to Cloudinary using backend environment secrets.
3. **Zero IDOR Vulnerability**: All user data operations derive identity strictly from signed HMAC-SHA256 JWT bearer tokens (`WHERE user_id = current_user.id`).
4. **Non-Clinical Positioning**: All predictions are presented as computational statistical estimates, never medical diagnoses or psychological evaluations.
