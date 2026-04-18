from __future__ import annotations

from contextlib import suppress
import json
import os
import uuid
from pathlib import Path
from typing import Any, Optional

import librosa
import numpy as np
import torch
import torchaudio
from demucs import pretrained
from demucs.apply import apply_model
from demucs.audio import save_audio
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from audiocraft.models import MusicGen

try:
    import essentia.standard as es  # type: ignore
except Exception:  # pragma: no cover
    es = None

try:
    from supabase import Client, create_client  # type: ignore
except Exception:  # pragma: no cover
    Client = Any  # type: ignore
    create_client = None


APP_TITLE = "Musaix Pro Local Pipeline"
OUTPUT_DIR = Path(__file__).parent / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv()


def _parse_origins() -> list[str]:
    configured = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in configured.split(",") if origin.strip()]

app = FastAPI(title=APP_TITLE)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_origins(),
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=4, max_length=1000)
    duration: int = Field(default=30, ge=5, le=60)
    instrumental: bool = True


_MUSICGEN: Optional[MusicGen] = None
_DEMUCS = None
_SUPABASE: Optional[Client] = None


NOTE_NAMES = np.array(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])


MAJOR_TEMPLATE = np.array([1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1], dtype=np.float32)
MINOR_TEMPLATE = np.array([1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], dtype=np.float32)


def get_musicgen() -> MusicGen:
    global _MUSICGEN
    if _MUSICGEN is None:
        print("Loading MusicGen model...")
        _MUSICGEN = MusicGen.get_pretrained("facebook/musicgen-small")
        _MUSICGEN.set_generation_params(duration=30)
    return _MUSICGEN


def get_demucs():
    global _DEMUCS
    if _DEMUCS is None:
        print("Loading Demucs model...")
        _DEMUCS = pretrained.get_model("htdemucs")
    return _DEMUCS


def get_supabase_client() -> Optional[Client]:
    global _SUPABASE
    if _SUPABASE is not None:
        return _SUPABASE

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key or create_client is None:
        return None

    _SUPABASE = create_client(supabase_url, supabase_key)
    return _SUPABASE


def _normalize_chroma(chroma_mean: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(chroma_mean)
    return chroma_mean if norm == 0 else chroma_mean / norm


def detect_key_with_templates(chroma_mean: np.ndarray) -> tuple[str, float]:
    chroma_n = _normalize_chroma(chroma_mean)

    major_scores = []
    minor_scores = []
    for shift in range(12):
        major_shifted = np.roll(MAJOR_TEMPLATE, shift)
        minor_shifted = np.roll(MINOR_TEMPLATE, shift)

        major_scores.append(float(np.dot(chroma_n, major_shifted / np.linalg.norm(major_shifted))))
        minor_scores.append(float(np.dot(chroma_n, minor_shifted / np.linalg.norm(minor_shifted))))

    major_idx = int(np.argmax(major_scores))
    minor_idx = int(np.argmax(minor_scores))
    major_best = major_scores[major_idx]
    minor_best = minor_scores[minor_idx]

    if major_best >= minor_best:
        return f"{NOTE_NAMES[major_idx]} Major", major_best
    return f"{NOTE_NAMES[minor_idx]} Minor", minor_best


def estimate_chords(chroma: np.ndarray, max_chords: int = 12) -> list[str]:
    if chroma.size == 0:
        return []

    dominant_notes = np.argmax(chroma, axis=0)
    symbols = [str(NOTE_NAMES[idx]) for idx in dominant_notes]

    deduped: list[str] = []
    for symbol in symbols:
        if not deduped or deduped[-1] != symbol:
            deduped.append(symbol)

    return deduped[:max_chords]


def extract_melody(y: np.ndarray, sr: int, max_points: int = 240) -> dict[str, Any]:
    try:
        f0, voiced_flag, voiced_prob = librosa.pyin(
            y,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sr,
        )

        f0_clean = np.nan_to_num(f0, nan=0.0)
        confidence = np.nan_to_num(voiced_prob, nan=0.0)

        if len(f0_clean) > max_points:
            idx = np.linspace(0, len(f0_clean) - 1, max_points, dtype=int)
            f0_view = f0_clean[idx]
            conf_view = confidence[idx]
        else:
            f0_view = f0_clean
            conf_view = confidence

        valid = f0_clean[(f0_clean > 0) & (confidence > 0.5)]
        if valid.size == 0:
            min_pitch = max_pitch = pitch_range = 0.0
        else:
            min_pitch = float(np.min(valid))
            max_pitch = float(np.max(valid))
            pitch_range = max_pitch - min_pitch

        return {
            "min_pitch": round(min_pitch, 2),
            "max_pitch": round(max_pitch, 2),
            "pitch_range": round(pitch_range, 2),
            "contour": [round(float(v), 3) for v in f0_view.tolist()],
            "confidence": [round(float(v), 3) for v in conf_view.tolist()],
        }
    except Exception:
        return {
            "min_pitch": 0.0,
            "max_pitch": 0.0,
            "pitch_range": 0.0,
            "contour": [],
            "confidence": [],
        }


def compute_mir(raw_path: Path) -> dict[str, Any]:
    y, sr = librosa.load(str(raw_path), sr=None, mono=True)

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)

    key, key_confidence = detect_key_with_templates(chroma_mean)
    chords = estimate_chords(chroma)

    rms = librosa.feature.rms(y=y)[0]
    energy_curve = rms[:120].astype(float).tolist()

    loudness_db = float(np.mean(librosa.amplitude_to_db(np.maximum(np.abs(y), 1e-7), ref=1.0)))

    danceability = float(np.clip((tempo / 180.0) * 0.6 + (float(np.mean(rms)) * 3.0), 0.0, 1.0))

    dynamic_complexity = float(np.std(rms))

    if es is not None:
        with suppress(Exception):
            key_name, scale, strength = es.KeyExtractor()(str(raw_path))
            key = f"{key_name} {scale.capitalize()}"
            key_confidence = float(strength)

    melody = extract_melody(y, sr)

    return {
        "tempo": round(float(tempo), 1),
        "key": key,
        "key_confidence": round(float(key_confidence), 3),
        "duration_sec": round(float(len(y) / sr), 2),
        "chords": chords,
        "danceability": round(danceability, 3),
        "loudness": round(loudness_db, 2),
        "dynamic_complexity": round(dynamic_complexity, 4),
        "energy_curve": [round(float(v), 4) for v in energy_curve],
        "melody": melody,
    }


def upload_to_supabase(job_id: str, raw_path: Path, stem_paths: dict[str, str]) -> dict[str, str]:
    client = get_supabase_client()
    if client is None:
        return {}

    uploaded: dict[str, str] = {}
    bucket_name = os.getenv("SUPABASE_STORAGE_BUCKET", "beats")

    with raw_path.open("rb") as fp:
        key = f"{job_id}/{raw_path.name}"
        client.storage.from_(bucket_name).upload(key, fp, {"upsert": "true"})
        uploaded["raw"] = key

    for name, stem in stem_paths.items():
        p = Path(stem)
        with p.open("rb") as fp:
            key = f"{job_id}/{p.name}"
            client.storage.from_(bucket_name).upload(key, fp, {"upsert": "true"})
            uploaded[name] = key

    return uploaded


def run_pipeline(req: GenerateRequest) -> dict[str, Any]:
    job_id = str(uuid.uuid4())[:8]
    base_path = OUTPUT_DIR / job_id

    musicgen = get_musicgen()
    demucs = get_demucs()

    musicgen.set_generation_params(duration=req.duration)
    wav = musicgen.generate([req.prompt], progress=False)[0].cpu()

    raw_path = base_path.with_name(f"{job_id}_raw.wav")
    torchaudio.save(str(raw_path), wav.unsqueeze(0), musicgen.sample_rate)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    sources = apply_model(demucs, wav.unsqueeze(0), device=device, progress=False)[0]

    stems = ["drums", "bass", "other", "vocals"]
    stem_paths: dict[str, str] = {}
    for name, source in zip(stems, sources):
        stem_path = base_path.with_name(f"{job_id}_{name}.wav")
        save_audio(source, str(stem_path), demucs.samplerate)
        stem_paths[name] = stem_path.name

    mir = compute_mir(raw_path)
    uploaded = upload_to_supabase(job_id, raw_path, stem_paths)

    return {
        "job_id": job_id,
        "prompt": req.prompt,
        "raw": raw_path.name,
        "stems": stem_paths,
        "mir": mir,
        "uploads": uploaded,
    }


@app.get("/")
def health() -> dict[str, str]:
    return {"status": "ok", "service": APP_TITLE}


@app.post("/generate")
def generate(req: GenerateRequest):
    try:
        return run_pipeline(req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/generate/stream")
async def generate_stream(req: GenerateRequest):
    async def event_stream():
        try:
            yield "data: Starting local pipeline\n\n"
            yield "data: Loading models\n\n"

            # We still run synchronously for deterministic model state,
            # but we emit stage updates before/after heavy sections.
            musicgen = get_musicgen()
            demucs = get_demucs()
            _ = (musicgen, demucs)

            yield "data: Generating audio with MusicGen\n\n"
            result = run_pipeline(req)

            yield "data: Running MIR analysis\n\n"
            yield "data: Upload step completed\n\n"

            payload = json.dumps(result)
            yield "event: result\n"
            yield f"data: {payload}\n\n"
            yield "data: COMPLETE\n\n"
        except Exception as exc:
            yield "event: error\n"
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/file/{filename}")
def get_file(filename: str):
    file_path = OUTPUT_DIR / Path(filename).name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
