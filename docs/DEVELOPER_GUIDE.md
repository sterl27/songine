# Musaix Pro Developer Guide

This guide is for engineers extending, debugging, and operating Musaix Pro.

## Table of contents

- [Documentation index](#documentation-index)
- [System architecture](#system-architecture)
- [Tech stack](#tech-stack)
- [Runbook](#runbook)
- [Configuration](#configuration)
- [Local pipeline API contract](#local-pipeline-api-contract)
- [Frontend integration notes](#frontend-integration-notes)
- [Backend pipeline internals](#backend-pipeline-internals)
- [Data flow](#data-flow)
- [Testing and validation](#testing-and-validation)
- [Troubleshooting](#troubleshooting)
- [Operational guidance](#operational-guidance)
- [MCP configuration notes](#mcp-configuration-notes)
- [Contribution checklist](#contribution-checklist)

---

## Documentation index

- Central docs hub: `docs/INDEX.md`
- Public quickstart: `README.md`
- Backend setup: `backend/README.md`
- Workspace/project-specific AI guidance: `guidelines/Guidelines.md`
- License/source acknowledgements: `ATTRIBUTIONS.md`

---

## System architecture

```text
React (Vite) UI
  ├─ Search / Analysis / AI / Compare tabs
  ├─ Local Pipeline Studio tab
  └─ localPipelineApi.ts (JSON + SSE client)
            │
            │ HTTP + SSE
            ▼
FastAPI backend (backend/app.py)
  ├─ POST /generate
  ├─ POST /generate/stream
  └─ GET /file/{filename}
            │
            ├─ MusicGen generation (AudioCraft)
            ├─ Demucs stem split
            ├─ MIR extraction (librosa + optional Essentia)
            └─ Optional Supabase artifact upload
```

---

## Tech stack

### Frontend

- React 18
- TypeScript
- Vite 6
- Tailwind CSS 4
- Radix UI components
- Recharts

### Backend

- FastAPI + Uvicorn
- PyTorch / torchaudio
- AudioCraft (MusicGen)
- Demucs
- librosa + numpy
- Essentia (optional)
- Supabase Python SDK (optional)

---

## Runbook

### 1) Frontend

```bash
pnpm install
pnpm dev
```

Build:

```bash
pnpm build
```

### 2) Backend

```bash
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 8000
```

Windows tip: if Python script shims are not available on PATH, use module form:

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app:app --reload --port 8000
```

### 3) Full local workflow

1. Start backend.
2. Start frontend.
3. Open Local Pipeline tab.
4. Generate from prompt.
5. Verify raw + stems + MIR in UI.

---

## Configuration

Root `.env` variables currently used:

| Variable | Used by | Required | Purpose |
|---|---|---:|---|
| `VITE_LOCAL_PIPELINE_URL` | Frontend | No | Base URL for local FastAPI backend |
| `SUPABASE_URL` | Backend | No | Enable artifact uploads |
| `SUPABASE_KEY` | Backend | No | Supabase auth key |
| `SUPABASE_STORAGE_BUCKET` | Backend | No | Bucket name (default `beats`) |

Notes:

- If Supabase values are missing, generation still works; upload is skipped.
- Keep secrets out of source control.

---

## Local pipeline API contract

Base URL default: `http://localhost:8000`

### `GET /`

Health check.

### `POST /generate`

Runs end-to-end pipeline and returns JSON with:

- `job_id`
- `raw` filename
- `stems` map (`drums`, `bass`, `other`, `vocals`)
- `mir` object
- `uploads` map (when Supabase upload enabled)

### `POST /generate/stream`

SSE endpoint used by frontend for progress streaming.

Event patterns:

- `data: <progress string>`
- `event: result` + JSON payload in `data:`
- `event: error` for failures

### `GET /file/{filename}`

Serves generated artifact from `backend/outputs`.

---

## Frontend integration notes

Primary integration files:

- `src/app/components/LocalPipelineStudio.tsx`
- `src/app/utils/localPipelineApi.ts`
- `src/app/components/MIRVisualizer.tsx`
- `src/app/components/MelodyVisualizer.tsx`
- `src/app/App.tsx` (tab registration)

Behavior summary:

- Studio tab calls stream endpoint.
- Progress lines append into log panel.
- Final `result` event hydrates audio players and MIR dashboards.

---

## Backend pipeline internals

Core implementation: `backend/app.py`

High-level stages:

1. Load models lazily (MusicGen, Demucs)
2. Generate raw waveform from prompt
3. Save raw WAV artifact
4. Run Demucs separation on raw waveform
5. Save stem artifacts
6. Run MIR extraction:
   - tempo (beat tracking)
   - key (template method, Essentia override when available)
   - chords (dominant chroma transitions)
   - loudness / danceability / dynamic complexity
   - energy curve
   - melody contour + confidence
7. Optional Supabase upload
8. Return JSON and/or stream progress

---

## Data flow

```text
Prompt -> /generate/stream -> MusicGen -> raw.wav
                               -> Demucs -> stems.wav
                               -> MIR -> metrics JSON
                               -> UI renders players + charts
```

---

## Testing and validation

### Frontend checks

```bash
pnpm build
```

### Backend smoke checks

- Open `http://localhost:8000/docs`
- Run `/generate` with short prompt and duration 5-10 sec
- Confirm `backend/outputs` contains generated files

### Manual UX checks

- Open Studio tab
- Generate a track
- Verify logs, audio playback, MIR cards, melody plot

---

## Troubleshooting

### Frontend build command fails (`vite` not found)

Install dependencies first:

```bash
pnpm install
```

### Backend module import errors

Ensure active Python environment and install requirements:

```bash
pip install -r backend/requirements.txt
```

### GPU not being used

- Confirm CUDA-compatible torch install.
- Verify GPU visibility in Python/Torch environment.

### Studio cannot connect to backend

- Ensure backend is running on expected host/port.
- Verify `VITE_LOCAL_PIPELINE_URL`.
- Check browser network tab for CORS or connection failures.

### Very slow first request

Expected due to initial model load and warm-up.

---

## Operational guidance

- Keep backend process warm for low-latency repeated runs.
- Clean `backend/outputs` periodically to prevent disk growth.
- For team usage, add structured logging and job queueing before multi-user rollout.

---

## MCP configuration notes

Workspace MCP configuration lives at `/.vscode/mcp.json`.

Current server entry included:

- `huggingface` → `https://huggingface.co/mcp`

To use it:

1. Replace placeholder token value in `Authorization` header.
2. Reload VS Code window.
3. Confirm MCP server tools are visible in your chat/agent environment.

Security recommendation:

- Avoid committing real secrets; use environment variables or local overrides.

---

## Contribution checklist

Before opening a PR:

1. `pnpm build` passes
2. Studio tab generation still works end-to-end
3. README + guide updated for behavior/config changes
4. No secrets committed
5. UI remains responsive on narrow/mobile breakpoints
