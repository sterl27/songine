# Musaix Pro 🎵

Modern music analysis + local AI music generation in one app.

Musaix Pro now supports a migrated Next.js frontend (`frontend/`) that reuses the existing UI from `src/app`, plus a self-hosted FastAPI audio backend so you can search, analyze, generate, split stems, and inspect MIR features.

## Live app

- Production: [`https://songine.vercel.app`](https://songine.vercel.app)

## Highlights

- Natural-language MIR search and ranked results
- Audio feature dashboards (tempo, energy, danceability, etc.)
- AI insight panels + song comparison workflows
- Local generation studio:
  - MusicGen prompt-to-audio
  - Demucs 4-stem separation
  - MIR extraction + melody confidence visualization
  - SSE progress logs in UI

## Quick start

### Next.js frontend (recommended)

```bash
pnpm --dir frontend install
pnpm --dir frontend dev
```

Open: `http://localhost:3000`

### Legacy Vite frontend

```bash
pnpm install
pnpm dev
```

Open: `http://localhost:5173`

### Local backend (for Studio tab)

```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

Open API docs: `http://localhost:8000/docs`

### Run full app locally (frontend + backend)

Use two terminals from the repo root:

Terminal A (backend):

```bash
python -m uvicorn backend.main:app --reload --port 8000
```

Terminal B (Next.js frontend):

```bash
pnpm --dir frontend dev
```

Then open the frontend URL printed by Next.js (`http://localhost:3000` by default).

## Environment

Create `.env` (or copy from `.env.example`):

```env
VITE_LOCAL_PIPELINE_URL=http://localhost:8000

# Next.js frontend
NEXT_PUBLIC_LOCAL_PIPELINE_PROXY_PATH=/api/local-pipeline
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_API_URL=http://localhost:8000

# Frontend Supabase Auth (public anon credentials)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here

# Optional Supabase upload config for backend artifacts
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_or_anon_key_here
SUPABASE_STORAGE_BUCKET=beats
```

`VITE_SUPABASE_ANON_KEY` is safe for browser usage. **Do not expose Supabase service-role keys in frontend code.**

For the Next.js frontend, use `frontend/.env.local.example` as the template and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_LOCAL_PIPELINE_PROXY_PATH` (defaults to `/api/local-pipeline`)
- `NEXT_PUBLIC_API_URL` (optional client-side API base)
- `BACKEND_API_URL` (server-side, used by Next API proxy routes)

> Note: `BACKEND_API_URL` is server-only and should point to your FastAPI host (for local dev: `http://localhost:8000`).

## Project map

```text
backend/   # FastAPI local generation + MIR pipeline
src/       # React app and UI components
supabase/  # Supabase functions/config helpers
docs/      # Developer docs
```

## Documentation

- Central docs index: [`docs/INDEX.md`](docs/INDEX.md)
- Full implementation and contributor guide: [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md)
- Vercel launch audit checklist: [`docs/VERCEL_PRODUCTION_AUDIT.md`](docs/VERCEL_PRODUCTION_AUDIT.md)
- Backend-specific notes: [`backend/README.md`](backend/README.md)
- Workspace design/coding guidance: [`guidelines/Guidelines.md`](guidelines/Guidelines.md)

## Status

Frontend production builds succeed:

- Legacy Vite: `pnpm build`
- Next.js: `pnpm --dir frontend build`

## Deploying Next.js frontend to Vercel

1. Create/import the project in Vercel and set **Root Directory** to `frontend`.
2. Keep framework preset as **Next.js**.
3. Configure environment variables in Vercel project settings:

  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_LOCAL_PIPELINE_PROXY_PATH` = `/api/local-pipeline`
  - `BACKEND_API_URL` = `https://your-fastapi-domain`

The Next API routes under `frontend/app/api/local-pipeline/*` proxy browser requests to your FastAPI backend using `BACKEND_API_URL`, avoiding direct client-to-backend CORS coupling.

## MCP setup (optional)

MCP (Model Context Protocol) is a way for compatible tools to connect to external model-backed services. You may want to set it up if you plan to use editor or agent workflows that can call a Hugging Face-hosted model through MCP.

This workspace includes `/.vscode/mcp.json` with a Hugging Face MCP server template for that optional integration.
Before use, set a valid token in the Authorization header:

`Bearer <HF_TOKEN>`

For security, prefer environment-based token injection where possible.

## License

MIT
