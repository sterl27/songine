from __future__ import annotations

import json
import os
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    import ollama as _ollama  # type: ignore
except ImportError:  # pragma: no cover
    _ollama = None

router = APIRouter(prefix="/agent", tags=["agent"])

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "hermes3")

ANALYZE_SYSTEM_PROMPT = """You are a professional music analyst and producer assistant.
Analyze the provided song metadata and return ONLY a valid JSON object (no markdown, no code fences) with exactly these keys:
- summary: string (2-3 sentences about the song)
- mood: string (e.g. "melancholic", "energetic", "dark")
- genre_hints: array of strings (2-4 genre labels)
- production_notes: string (brief production style observations)
- dj_tips: string (1-2 sentences for DJs)
- similar_artists: array of strings (2-4 similar artists)
- fun_fact: string (one interesting fact or observation)

Respond with ONLY the JSON object, nothing else."""


class SongPayload(BaseModel):
    id: str = ""
    title: str
    artist: str = ""
    album: str = ""
    genre: str = ""
    year: int | None = None
    bpm: float | None = None
    key: str = ""
    energy: float | None = None
    danceability: float | None = None


class AnalyzeRequest(BaseModel):
    song: SongPayload
    model: str = Field(default="", description="Override Ollama model (leave empty for default)")


class AgentChatRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=4000)
    system: str = Field(default="You are a helpful music production assistant.", max_length=2000)
    model: str = Field(default="", description="Override Ollama model")
    stream: bool = False


def _get_client() -> Any:
    if _ollama is None:
        raise HTTPException(
            status_code=503,
            detail="Ollama Python client not installed. Run: pip install ollama",
        )
    return _ollama.Client(host=OLLAMA_HOST)


def _build_song_description(song: SongPayload) -> str:
    parts = [f'Title: "{song.title}"']
    if song.artist:
        parts.append(f"Artist: {song.artist}")
    if song.album:
        parts.append(f"Album: {song.album}")
    if song.genre:
        parts.append(f"Genre: {song.genre}")
    if song.year:
        parts.append(f"Year: {song.year}")
    if song.bpm:
        parts.append(f"BPM: {song.bpm:.1f}")
    if song.key:
        parts.append(f"Key: {song.key}")
    if song.energy is not None:
        parts.append(f"Energy: {song.energy:.2f}")
    if song.danceability is not None:
        parts.append(f"Danceability: {song.danceability:.2f}")
    return "\n".join(parts)


@router.get("/health")
async def agent_health() -> dict[str, str]:
    """Check Ollama connectivity and model availability."""
    if _ollama is None:
        return {"status": "error", "detail": "ollama package not installed"}
    try:
        client = _get_client()
        models = client.list()
        model_names = [m.model for m in models.models]
        model = OLLAMA_MODEL
        available = any(m.startswith(model) for m in model_names)
        return {
            "status": "ok" if available else "model_missing",
            "model": model,
            "host": OLLAMA_HOST,
            "available_models": ", ".join(model_names),
        }
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


@router.post("/analyze")
async def analyze_song(req: AnalyzeRequest) -> dict[str, Any]:
    """Analyze a song using the local Hermes agent via Ollama."""
    client = _get_client()
    model = req.model or OLLAMA_MODEL
    song_desc = _build_song_description(req.song)

    try:
        response = client.chat(
            model=model,
            messages=[
                {"role": "system", "content": ANALYZE_SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this song:\n\n{song_desc}"},
            ],
            options={"temperature": 0.7, "num_predict": 512},
        )
        raw = response.message.content.strip()

        # Strip markdown code fences if model added them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Model returned invalid JSON: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Ollama error: {exc}") from exc


@router.post("/chat")
async def agent_chat(req: AgentChatRequest) -> dict[str, Any] | StreamingResponse:
    """Open-ended chat with the Hermes agent."""
    client = _get_client()
    model = req.model or OLLAMA_MODEL

    if req.stream:
        def _stream():
            for chunk in client.chat(
                model=model,
                messages=[
                    {"role": "system", "content": req.system},
                    {"role": "user", "content": req.prompt},
                ],
                stream=True,
            ):
                delta = chunk.message.content or ""
                if delta:
                    yield f"data: {json.dumps({'delta': delta})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(_stream(), media_type="text/event-stream")

    try:
        response = client.chat(
            model=model,
            messages=[
                {"role": "system", "content": req.system},
                {"role": "user", "content": req.prompt},
            ],
            options={"temperature": 0.7},
        )
        return {"response": response.message.content}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Ollama error: {exc}") from exc
