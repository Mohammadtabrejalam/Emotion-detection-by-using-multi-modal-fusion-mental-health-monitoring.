# Validation commands

Run at repo root:

```text
python -m pytest backend/tests -q
python -m bandit -r backend/app -s B101
```

Install `bandit` separately for the static scan. Unit/API tests run with an isolated temporary SQLite database and explicitly test-only classifier doubles. They test contracts and security boundaries; they are not real-model evaluations. Legacy research tests skip when their original data/checkpoint prerequisites are absent.

```text
cd frontend
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts an isolated backend database plus Vite. If a text checkpoint is installed it verifies actual inference; otherwise it asserts an explicit missing-model error. GitHub Actions installs the text checkpoint. No simulation checkbox or invented result is used. Real hardware permission prompts and SMTP delivery require manual validation on the target environment.

To exercise all three real models and the account data flow without browser doubles, install the models/FFmpeg and run `python -m scripts.smoke_real --clip <official-RAVDESS-full-AV-clip>`. It creates and deletes disposable test data. This is not an accuracy benchmark. See `docs/EVALUATION_PUBLISHED.md` for actual dataset metrics and reproduction commands.

Dependency checks are enforced in CI with `npm audit` and `pip-audit`. The CPU PyTorch wheel has a local version suffix that PyPI auditing skips, so CI separately checks the corresponding upstream Torch version. Passing advisory checks is not a security guarantee.
