cd "c:\Users\sterl\Downloads\Songine"
pnpm dev# Musaix Pro Project Guidelines

These guidelines keep contributions consistent across the React frontend and local FastAPI audio backend.

## 1) General engineering rules

- Prefer small, focused changes over broad refactors.
- Keep naming explicit and domain-oriented (`mir`, `stems`, `melody`, `pipeline`).
- Maintain TypeScript types for all API responses consumed by UI.
- Document new environment variables in both `README.md` and `docs/DEVELOPER_GUIDE.md`.

## 2) Frontend conventions

- Use existing UI primitives from `src/app/components/ui/` before introducing new ones.
- Keep styling within Tailwind utility classes and match the dark/pink Liquid Noir theme.
- Ensure new components are responsive at mobile widths.
- For async interactions:
  - show loading state
  - show actionable error state
  - avoid silent failures

## 3) API and integration conventions

- Add/extend API types in `src/app/utils/*` first, then consume in components.
- Keep endpoint URLs centralized in utility modules (avoid hardcoding in components).
- For SSE endpoints, handle:
  - message progress lines
  - explicit `result` events
  - explicit `error` events

## 4) Backend conventions

- Keep model loading lazy and singleton-style to avoid repeated initialization.
- Treat optional integrations (e.g., Supabase upload) as non-blocking.
- Return stable JSON shapes; avoid breaking keys once consumed by frontend.
- Keep output artifacts inside `backend/outputs/` unless feature explicitly changes storage path.

## 5) Documentation standards

- Update all impacted docs in the same change when behavior/config changes:
  - `README.md` (public quickstart)
  - `backend/README.md` (runtime/API details)
  - `docs/DEVELOPER_GUIDE.md` (deep technical notes)
- Prefer concise examples that match current code exactly.

## 6) Security and secrets

- Never commit real API keys/tokens.
- Keep placeholders in tracked config files (e.g., MCP auth headers).
- Prefer env-based secret injection when supported.

## 7) Validation checklist

Before merging:

1. `pnpm build` succeeds.
2. Local pipeline still generates raw + stems.
3. MIR dashboard renders expected fields.
4. Docs are updated and internally consistent.
