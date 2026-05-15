# Codebase Review Report

_Date: 2026-05-14_

## Executive Summary

The codebase is in a solid operational state with clean diagnostics and working CI smoke coverage. The highest-priority security/runtime issues identified in review have now been addressed:

1. OpenRouter access moved from client-side usage to a server-side API route.
2. Runtime config was aligned to Next.js env usage for shared frontend code paths.
3. Rate limiting now supports shared-store enforcement (Upstash Redis REST) with safe in-memory fallback.

## Scope Reviewed

- Frontend app/runtime code (`src/`, `frontend/app/api/`, `frontend/lib/server/`)
- Backend service and auth wiring (`backend/`)
- Environment/config docs and templates (`README.md`, `WORKFLOW.md`, `.env.example`, `frontend/.env.local.example`)
- CI workflow (`.github/workflows/ci.yml`)

## Current Health Snapshot

- **Workspace diagnostics:** no errors found
- **Frontend build path:** verified passing (`pnpm --dir frontend build`)
- **Backend smoke path:** covered by CI import/syntax checks
- **Auth/search/manual runtime checks:** previously verified working

## Post-Refactor Stabilization Notes

After implementing the security/runtime refactor, an additional debug pass was completed to stabilize integration details:

- Fixed a malformed leftover function signature in `frontend/lib/server/rate-limit.ts` that could break route execution.
- Added backward-compatible env support in `frontend/app/api/agent/openrouter-analyze/route.ts` for:
  - `OPENROUTER_API_KEY` / `OPENROUTER_MODEL`
  - `openrouter_api_key` / `openrouter_model`
- Revalidated full frontend production build after fixes: ✅ pass.

## Key Findings and Status

### 1) Client-side provider key exposure risk (OpenRouter)

- **Previous state:** OpenRouter API key was consumed in client runtime code.
- **Risk:** Key exposure in browser-delivered code and env mismatch risk.
- **Status:** ✅ **Resolved**
- **Implemented in:**
  - `frontend/app/api/agent/openrouter-analyze/route.ts` (new)
  - `src/app/utils/api.ts` (client now calls internal API route)

### 2) Mixed env strategy in shared frontend runtime

- **Previous state:** Shared runtime paths used Vite-style env lookups while app runs under Next.js.
- **Risk:** Configuration drift and inconsistent behavior across environments.
- **Status:** ✅ **Resolved**
- **Implemented in:**
  - `src/app/utils/supabaseAuth.ts`
  - `src/app/components/AIInsights.tsx`
  - `src/app/utils/api.ts`

### 3) Process-local rate limiting only

- **Previous state:** In-memory `Map` limiter only.
- **Risk:** Ineffective limits in multi-instance/serverless production.
- **Status:** ✅ **Improved**
- **Implemented in:**
  - `frontend/lib/server/rate-limit.ts` (async limiter + Upstash Redis REST option)
  - Route updates to await limiter:
    - `frontend/app/api/agent/analyze/route.ts`
    - `frontend/app/api/local-pipeline/generate/route.ts`
    - `frontend/app/api/local-pipeline/generate/stream/route.ts`

## Documentation and Template Alignment

Updated to match runtime reality and safer key handling:

- `README.md`
- `WORKFLOW.md`
- `.env.example`
- `frontend/.env.local.example`

## Remaining Recommendations (Prioritized)

1. **Add CI API-level backend smoke test**
   - Start app in CI and hit `/health` (not just import + py_compile).
2. **Formalize frontend architecture direction**
   - Continue convergence strategy for legacy shared `src/app` + Next app boundary.
3. **CSP telemetry decision**
   - Either allow expected telemetry script host(s) or remove blocked integration to reduce console noise.

## Risk Matrix (Post-Remediation)

| Area | Risk Level | Notes |
|---|---|---|
| Secrets exposure in client | Low | OpenRouter key moved server-side |
| Runtime env drift | Low | Next.js env usage aligned in shared runtime |
| Rate-limit consistency in prod | Medium-Low | Shared-store supported; requires Upstash envs in deployment |
| Architecture drift (dual frontend boundary) | Medium | Still a strategic maintenance concern |

## Conclusion

The codebase is currently stable and significantly improved on security/configuration correctness. The most impactful remediation items are complete. Remaining work is mostly strategic hardening and CI depth improvements, not immediate blockers.
