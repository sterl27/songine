# Musaix Pro 🎵

Modern music analysis + local AI music generation in one app.

Musaix Pro pairs a polished React/Vite frontend with a self-hosted FastAPI audio backend so you can search, analyze, generate, split stems, and inspect MIR features — fully local when needed.

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

### Frontend

```bash
pnpm install
pnpm dev
```

Open: `http://localhost:5173`

### Local backend (for Studio tab)

```bash
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 8000
```

Open API docs: `http://localhost:8000/docs`

## Environment

Create `.env` (or copy from `.env.example`):

```env
VITE_LOCAL_PIPELINE_URL=http://localhost:8000

# Frontend Supabase Auth (public anon credentials)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here

# Optional Supabase upload config for backend artifacts
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_or_anon_key_here
SUPABASE_STORAGE_BUCKET=beats
```

`VITE_SUPABASE_ANON_KEY` is safe for browser usage. **Do not expose Supabase service-role keys in frontend code.**

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
- Backend-specific notes: [`backend/README.md`](backend/README.md)
- Workspace design/coding guidance: [`guidelines/Guidelines.md`](guidelines/Guidelines.md)

## Status

Frontend production build succeeds (`pnpm build`).

## MCP setup (optional)

MCP (Model Context Protocol) is a way for compatible tools to connect to external model-backed services. You may want to set it up if you plan to use editor or agent workflows that can call a Hugging Face-hosted model through MCP.

This workspace includes `/.vscode/mcp.json` with a Hugging Face MCP server template for that optional integration.
Before use, set a valid token in the Authorization header:

`Bearer <HF_TOKEN>`

For security, prefer environment-based token injection where possible.

## License

MIT
