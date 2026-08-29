# MindSense Automated Testing & CI/CD Specification

## Testing Infrastructure Overview
MindSense maintains a 100% automated test suite across backend APIs, frontend component units, end-to-end browser flows, security scanners, and dependency audits.

```
+-----------------------------------------------------------------------------------+
|                            GitHub Actions Workflow                                |
|                               (.github/workflows/test.yml)                         |
+--------------------------+--------------------------+-----------------------------+
|     Backend Job          |       Frontend Job       |           E2E Job           |
|  - Pytest API Suite      |  - Vitest Unit Suite     |  - Playwright Headless      |
|  - IDOR Security Tests   |  - TypeScript Build      |  - User Journey E2E         |
|  - Bandit Code Scan      |  - NPM Audit CVE Scan    |  - Developer Security E2E   |
|  - Pip Audit CVE Scan    |                          |                             |
+--------------------------+--------------------------+-----------------------------+
```

## CLI Execution Commands

### 1. Backend Pytest API & IDOR Security Suite
```bash
python -m pytest backend/tests -v
```

### 2. Frontend Vitest Component Unit Tests
```bash
cd frontend
npm test
```

### 3. Playwright End-to-End Browser Tests
```bash
cd frontend
npx playwright test
```

### 4. Static Code Security & Dependency CVE Scans
```bash
# Backend Bandit Security Analysis
bandit -r backend/app

# Backend Dependency CVE Scan
pip-audit

# Frontend Dependency Vulnerability Scan
cd frontend
npm audit
```
