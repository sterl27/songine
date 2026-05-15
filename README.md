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

### Automated full setup (recommended)

```bash
./setup.sh
```

This bootstraps root + frontend dependencies, creates `backend/venv`, installs backend Python packages, and builds the Next.js frontend.

### Next.js frontend (recommended)

```bash
pnpm --dir frontend install
pnpm --dir frontend dev
```

Open: `http://localhost:3000`

### Local backend (for Studio tab)

Install system prerequisites first (Debian/Ubuntu):

```bash
sudo apt install -y python3-venv python3-pip build-essential pkg-config libavformat-dev libavcodec-dev libswresample-dev
```

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Open API docs: `http://localhost:8000/docs`

### Run full app locally (frontend + backend)

Use two terminals from the repo root:

Terminal A (backend):

```bash
pnpm backend:dev
```

Terminal B (Next.js frontend):

```bash
pnpm dev:frontend
```

Then open the frontend URL printed by Next.js (`http://localhost:3000` by default).

## Environment

Create `.env` (or copy from `.env.example`):

```env
# Next.js frontend
NEXT_PUBLIC_LOCAL_PIPELINE_PROXY_PATH=/api/local-pipeline
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_API_URL=http://localhost:8000

# Frontend Supabase Auth (public anon credentials)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key_here

# Optional AI fallback config (server-side in frontend/app/api/agent/openrouter-analyze/route.ts)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=nousresearch/hermes-3-llama-3.1-405b:free
NEXT_PUBLIC_SITE_URL=https://songine.vercel.app

# Optional shared rate limiting (recommended in production)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

# Optional Supabase upload config for backend artifacts
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_or_anon_key_here
SUPABASE_STORAGE_BUCKET=beats
SUPABASE_JWT_SECRET=your-jwt-secret
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe for browser usage. **Do not expose Supabase service-role keys in frontend code.**

For the Next.js frontend, use `frontend/.env.local.example` as the template and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_LOCAL_PIPELINE_PROXY_PATH` (defaults to `/api/local-pipeline`)
- `NEXT_PUBLIC_API_URL` (optional client-side API base)
- `BACKEND_API_URL` (server-side, used by Next API proxy routes)

Optional (for AI fallback behavior in `src/app/utils/api.ts`):

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `NEXT_PUBLIC_SITE_URL` (optional; used as OpenRouter referer fallback)

Optional (for multi-instance rate limiting in `frontend/lib/server/rate-limit.ts`):

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Security note:

- Keep secrets in `frontend/.env.local` (or platform env settings) only.
- Do **not** store secrets in `frontend/app/env.local`.

> Note: `BACKEND_API_URL` is server-only and should point to your FastAPI host (for local dev: `http://localhost:8000`).

### Verify API keys quickly

You can validate configured keys with provider model/settings endpoints:

- Supabase Auth settings: `GET <NEXT_PUBLIC_SUPABASE_URL>/auth/v1/settings`
- Supabase function health: `GET <NEXT_PUBLIC_SUPABASE_URL>/functions/v1/make-server-aa7dba7b/health`
- OpenRouter models: `GET https://openrouter.ai/api/v1/models`
- OpenAI models: `GET https://api.openai.com/v1/models`

Expected success status: `200`.

## Project map

```text
backend/   # FastAPI local generation + MIR pipeline
src/       # React app and UI components
supabase/  # Supabase functions/config helpers
docs/      # Developer docs
```

## Documentation

- Central docs index: [`docs/INDEX.md`](docs/INDEX.md)
- Command quick reference: [`QUICKSTART.md`](QUICKSTART.md)
- Workflow guide: [`WORKFLOW.md`](WORKFLOW.md)
- Full implementation and contributor guide: [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md)
- Latest codebase review: [`docs/CODEBASE_REVIEW_2026-05-14.md`](docs/CODEBASE_REVIEW_2026-05-14.md)
- Vercel launch audit checklist: [`docs/VERCEL_PRODUCTION_AUDIT.md`](docs/VERCEL_PRODUCTION_AUDIT.md)
- Backend-specific notes: [`backend/README.md`](backend/README.md)
- Workspace design/coding guidance: [`guidelines/Guidelines.md`](guidelines/Guidelines.md)

## Status

Frontend production builds succeed:

- Next.js: `pnpm --dir frontend build`

Combined full-stack check:

- `pnpm build:all` (runs frontend build + backend verification; if backend deps are missing, run `pnpm backend:install`)

CI:

- GitHub Actions workflow at `.github/workflows/ci.yml` runs:
  - Frontend production build
  - Backend smoke checks (imports + syntax compile)

## Deploying Next.js frontend to Vercel

Use `frontend/vercel.json` as the authoritative Vercel config for this project.

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
