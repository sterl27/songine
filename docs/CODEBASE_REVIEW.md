# Codebase Review

_Date: 2026-04-21_

## Summary

Reviewed architecture, key entrypoints, env/config, auth/session paths, deployment files, and runtime diagnostics. No compile/language-service errors detected. Core startup paths are healthy.

---

## Strengths

- Sensible Next.js proxy routes for backend isolation (`frontend/app/api/local-pipeline/*`).
- Defensive env handling in middleware — prevents startup crashes when Supabase keys are absent (`frontend/lib/supabase/middleware.ts`).
- Good documentation structure: `README.md`, `docs/INDEX.md`, `docs/DEVELOPER_GUIDE.md`.
- Backend health endpoint and optional integrations (Supabase upload) designed as non-blocking.
- Security headers, CSP, and no-store cache controls implemented thoughtfully in `frontend/next.config.ts`.
- Rate limiting present on expensive proxy endpoints (`frontend/lib/server/rate-limit.ts`).

---

## Findings (prioritized)

### 1. Dual-frontend architecture — High

**Problem**
Two separate frontend runtimes co-exist:
- Legacy Vite app (`src/`, root `package.json`, port 5173)
- Next.js app (`frontend/`, `frontend/package.json`, port 3000)

The Next.js entrypoint imports the legacy app directly via `../../src/app/App`, creating cross-boundary coupling.

**Risk**
Dependency/config drift over time. Two sets of tooling, two `pnpm-lock.yaml` files, two sets of Tailwind/Radix versions that can diverge independently.

**Recommendation**
Decide on one canonical frontend. The recommended path is to fully move `src/app` components under `frontend/src` and delete the root Vite setup, or formalize `src/` as a proper workspace package consumed by `frontend/`.

---

### 2. In-memory rate limiter — Medium-High

**File:** `frontend/lib/server/rate-limit.ts`

**Problem**
Rate state is stored in a process-local `Map`. On serverless deployments (Vercel), each function instance has its own in-memory state; limits reset on cold starts and are not shared across instances.

**Recommendation**
Replace with a shared atomic backend:
- [Upstash Redis](https://upstash.com/) (serverless-friendly, pay-per-request)
- Vercel KV (same interface)

Keep the same `enforceRateLimit` function signature; swap the store underneath.

---

### 3. Mixed Supabase credential strategy — Medium

**Files:** `src/app/utils/supabaseAuth.ts`, `src/app/utils/api.ts`

**Problem**
Both files fall back to hardcoded constants from `utils/supabase/info` when env vars are absent. The Next.js middleware and server client (`frontend/lib/supabase/`) correctly use env vars only. These two paths may silently use different projects or keys depending on build environment.

**Recommendation**
Standardize on env-first everywhere. Remove or gate hardcoded fallbacks behind an explicit `DEMO_MODE` flag so runtime behavior is unambiguous.

---

### 4. Backend is a monolith — Medium

**File:** `backend/app.py` (~220+ lines in one file)

**Problem**
Model lifecycle (MusicGen, Demucs), MIR analysis, SSE streaming, file serving, and Supabase upload are all co-located. This hurts testability and makes incremental changes higher-risk.

**Recommendation**
Split into focused modules:

```
backend/
  services/
    musicgen.py    # model lifecycle + generation
    mir.py         # chroma, key, tempo, melody
    storage.py     # Supabase upload
  routers/
    generate.py    # POST /generate, POST /generate/stream
    files.py       # GET /file/{filename}
```

This can be done incrementally — move one service at a time without changing the API contract.

---

### 5. No automated tests or CI — Medium

**Problem**
The developer guide documents only manual smoke checks and `pnpm build`. No `pytest`, `vitest`/`jest`, or GitHub Actions workflow exists.

**Recommendation**
Start small to get CI coverage:

**Backend** (pytest)
- `/health` returns `{"status": "ok"}`
- `get_current_user` raises 401 with missing/bad token
- Pure utility functions: `detect_key_with_templates`, `estimate_chords`, `_normalize_chroma`

**Frontend** (Vitest or Jest + Testing Library)
- `enforceRateLimit` unit test
- `getBackendApiBaseUrl` fallback logic
- API proxy smoke test (mock fetch)

**CI** (GitHub Actions)
```yaml
on: [push, pull_request]
jobs:
  frontend:
    run: pnpm --dir frontend build && pnpm --dir frontend typecheck
  backend:
    run: pytest backend/
```

---

### 6. Production controls pending — Medium (pre-launch)

`docs/VERCEL_PRODUCTION_AUDIT.md` lists outstanding items that are launch blockers:

1. **Backend not deployed** — `BACKEND_API_URL` is unset in production; all `/api/local-pipeline/*` calls will fail.
2. **Deployment Protection + WAF** not configured in Vercel dashboard.
3. **No incident response runbook**.

See the audit doc for the full recommended 48-hour launch plan.

---

## Quick-win next steps

| Priority | Action | Effort |
|---|---|---|
| 1 | Pick canonical frontend, remove Vite/Next duplication | Medium |
| 2 | Swap in-memory limiter for Upstash/Vercel KV | Small |
| 3 | Add 3 pytest tests + GitHub Actions CI | Small |
| 4 | Standardize Supabase credential path (`env`-only) | Small |
| 5 | Split `backend/app.py` into service modules | Medium |
| 6 | Deploy backend + set `BACKEND_API_URL` for Vercel | Depends on infra |
