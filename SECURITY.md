# MindSense Security Architecture & Vulnerability Mitigation

## 1. Authentication & Authorization
- **HMAC-SHA256 Signed JWTs**: User and Developer tokens are signed server-side using 64-character secret keys (`JWT_SECRET`).
- **Server-Side Session Revocation**: Active tokens are verified against the `active_sessions` database table. Logout revokes token JTIs instantly.
- **Server-Side RBAC**: Developer endpoints require signed Developer tokens. Requests from standard user tokens return `401 Unauthorized` or `403 Forbidden`.

## 2. IDOR Prevention Guarantee
- No endpoint accepts an unverified `user_id` query parameter to query user records.
- Queries execute strictly using `current_user.id` extracted from signature-verified JWT claims:
  ```python
  user = get_current_user_from_req(request)
  records = db.query(AnalysisResult).filter(AnalysisResult.user_id == user.id).all()
  ```

## 3. Media & Upload Security
- **Backend Upload Gateway**: Frontend clients NEVER receive Cloudinary secrets. Files are submitted to FastAPI `/api/analyze`, validated against maximum 10MB file limits and allowed MIME types (`image/jpeg`, `image/png`, `audio/wav`, `audio/mp3`), and securely dispatched.
- **Safe PyTorch Deserialization**: Model loading enforces `weights_only=True` (`torch.load(..., weights_only=True)`), preventing unpickling vulnerabilities.

## 4. Rate Limiting & Crisis Keyword Safety
- **Sliding-Window Rate Limiting**: In-memory sliding window rate limiter protects sensitive endpoints (`/api/auth/*`, `/api/analyze`, `/api/feedback`) returning `HTTP 429` if exceeded.
- **Crisis Response Protocol**: The chatbot detects crisis keywords (suicide, self-harm) and immediately responds with verified non-clinical support hotline resources.
