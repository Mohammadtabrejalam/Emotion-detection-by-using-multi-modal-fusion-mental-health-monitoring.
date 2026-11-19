# Current serving architecture

The React frontend calls same-origin `/api`. Vite proxies requests in development; FastAPI serves the built frontend in the container. FastAPI authenticates bearer sessions, validates uploads, and offloads CPU inference to a worker thread. A model lock serializes inference within the single supported server process.

The inference registry pins published model revisions. `EmotionEngine` decodes 16 kHz audio, detects exactly one frontal face, tokenizes English text, loads only locally installed weights, and runs PyTorch inference. Text label projection and support-aware equal-weight late fusion are explicit functions. Every used modality returns its own label, scores, model ID, and revision. Model status distinguishes installed files from successfully loaded models.

Guest results exist only in the response. For authenticated users, SQLite stores result metadata/scores and ownership; it does not store raw analysis inputs. Private history, dashboard, journal, check-in, export, and deletion routes require authentication. Random expiring bearer share tokens expose only the selected result, and can be revoked. Clear-history and account-delete cascade into shared-result records.

Passwords use salted PBKDF2-SHA256. Signed tokens require the expected algorithm, expiry, account type, and current account version. Logout revokes a token; password change/reset invalidates older tokens. Password-reset tokens are hashed, expire in 30 minutes, and are single use. SMTP delivers recovery tokens outside explicit test mode. Production startup requires a configured signing secret. Local development generates a private signing-key file. Default accounts and fabricated articles/studies are test fixtures only.

SQLite is unencrypted by the application. Use HTTPS and encrypted volumes/backups when hosting; retain only records needed for your demonstration. Browser bearer tokens are stored in localStorage, so XSS remains a material risk. No sensitive message bodies are intentionally logged. Backend media decoding may use temporary files and deletes them in `finally` cleanup.

Older code under `backend/app/ml` is research infrastructure. The current API does not instantiate its randomly initialized multimodal network or read synthetic evaluation metrics. The app guide is a scripted FAQ, and game scores are user-submitted educational scores, not trusted experiment outcomes.
