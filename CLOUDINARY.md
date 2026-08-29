# MindSense Cloudinary Media Storage Specification

## Overview
MindSense uses **Cloudinary** for backend-mediated media asset management. Frontend applications never hold Cloudinary API keys or secret credentials.

```
+----------+          +-------------------+          +------------------------+
| Browser  | -------> |  FastAPI Gateway  | -------> | Cloudinary Storage API |
| (Client) | FormData | (File Validation) | Signed   | (Secure Asset CDN)     |
+----------+          +-------------------+          +------------------------+
```

## Security & Upload Flow
1. Client submits audio (`.wav`, `.mp3`) or image (`.jpg`, `.png`) to `/api/analyze`.
2. FastAPI executes `validate_media_file()`:
   - Size limit: Max **10MB**.
   - Allowed MIME types: `image/jpeg`, `image/png`, `audio/wav`, `audio/mpeg`.
   - Content verification & safe filename generation.
3. Server uploads to Cloudinary folder `mindsense/images` or `mindsense/audio`.
4. Cloudinary returns a secure asset ID and CDN URL.
5. Reference metadata is recorded in PostgreSQL table `analysis_input_metadata`.
6. Client receives analysis results without raw file credential exposure.
