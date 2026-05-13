# Codebase Review

_Date: 2026-05-13_

## Summary

Reviewed runtime scripts, dependency manifests, current docs, and production build paths. Implemented the first three remediation actions from the prior review.

Validated commands:

- `pnpm --dir frontend build` ✅ passes
- `pnpm build:all` ⚠️ fails when backend deps are missing, but now reports actionable guidance:
	- `Backend verification failed: missing Python packages: fastapi, uvicorn`
	- `Run: pnpm backend:install`

---

## Strengths

- Next.js build pipeline is stable and type/lint checks pass during build.
- Proxy routing strategy under `frontend/app/api/local-pipeline/*` keeps browser/backend coupling controlled.
- Project now has a dedicated workflow guide and quickstart for local operation.
- Build and dev scripts are centralized under root `package.json`.

---

## Findings (Current)

### 1. Backend verification is now explicit and actionable — Resolved

**Where**

- `package.json` scripts: `build:all` and `backend:verify` in [package.json](../package.json#L11) and [package.json](../package.json#L17)

**Issue**

`backend:verify` is now handled by `scripts/backend-verify.sh`, which checks for `backend/venv` and required Python modules before reporting status.

**Observed behavior**

Friendly failure guidance is shown with the exact remediation command.

**Recommendation**

Keep current strict behavior for CI/local correctness; it now fails fast with clear instructions.

---

### 2. Frontend dependency hygiene cleanup — Resolved

**Where**

- [frontend/package.json](../frontend/package.json#L47)

**Issue**

Removed unreferenced tooling-style packages from `frontend/package.json` (`ai`, `cli`, `gateway`, `gh`, `shadcn`, `vercel`) and regenerated lockfile.

**Recommendation**

Add periodic dependency hygiene checks to prevent recurrence.

---

### 3. Root questionable dependency cleanup — Resolved

**Where**

- `workflow` dependency in [package.json](../package.json#L79)

**Issue**

Removed `workflow` from root dependencies and regenerated `pnpm-lock.yaml`.

**Recommendation**

Continue to review unexpected manifest diffs before committing lockfile updates.

---

### 4. Dual-frontend architecture remains a medium-term maintenance risk — Medium

**Where**

- Root Vite app + Next.js app in `frontend/`
- Cross-boundary import from Next.js entrypoint into legacy app

**Issue**

Two active frontend dependency stacks and lockfiles increase drift risk over time.

**Recommendation**

- Either complete migration to Next.js-owned source tree or formalize shared UI code as a workspace package.

---

## Open Questions

1. Is root Vite still a supported runtime, or should it be marked deprecated in docs?
2. Should shared UI code be extracted into a proper workspace package to reduce Next/Vite coupling?

---

## Newly Implemented

1. Hardened backend verification script and wired it into `pnpm backend:verify`.
2. Pruned accidental dependencies from root and frontend manifests.
3. Added CI workflow at `.github/workflows/ci.yml`:
	- Frontend production build job.
	- Backend smoke job (Python import + syntax compile checks).

---

## Next steps

| Priority | Action | Effort |
|---|---|---|
| 1 | Decide canonical frontend architecture and document deprecation plan | Medium |
| 2 | Add lightweight backend API test (e.g., `/health`) to CI | Small |
| 3 | Replace process-local rate limiter store with shared backend (Redis/KV) | Small |
