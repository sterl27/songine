# Musaix Pro Local Pipeline Backend

This backend runs a fully local generation and MIR analysis workflow:

- MusicGen (text-to-music)
- Demucs (4-stem separation: drums, bass, other, vocals)
- MIR analysis (tempo, key, chords, loudness, danceability, energy, melody contour)
- Optional Supabase Storage upload
- JSON and SSE endpoints for frontend integration

## 1) Install Python dependencies

Create and activate a Python environment (recommended), then install requirements:

- `pip install -r backend/requirements.txt`

If you're using CUDA with PyTorch, install CUDA wheels first (before requirements) using the official PyTorch index URL.

Windows compatibility tip:

- Use `python -m pip install -r backend/requirements.txt` if `pip` command shims are not available.

## 2) Environment variables

The app reads these env vars (optional unless you want Supabase upload):

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_STORAGE_BUCKET` (default: `beats`)

## 3) Run backend

From the project root:

- `uvicorn backend.app:app --reload --port 8000`

Alternative module-based launch:

- `python -m uvicorn backend.app:app --reload --port 8000`

## 4) Endpoints

- `GET /` health check
- `POST /generate` returns full result JSON
- `POST /generate/stream` SSE events + final `result` event
- `GET /file/{filename}` returns generated WAV files

Default host/port for local usage:

- `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

## Example payload

```json
{
  "prompt": "dark cinematic trap beat 94 BPM heavy 808 triplet hats indigo haze noir atmosphere",
  "duration": 30,
  "instrumental": true
}
```

## Notes

- First request is slower due to model load.
- GPU is automatically used for Demucs when available.
- Key detection uses Essentia when available, with a librosa fallback.
- Supabase upload is optional; pipeline still runs if Supabase env vars are absent.
- Generated artifacts are saved under `backend/outputs/`.

## Related docs

- Central docs index: `../docs/INDEX.md`
- Root project guide: `../README.md`
- Full contributor/developer guide: `../docs/DEVELOPER_GUIDE.md`
