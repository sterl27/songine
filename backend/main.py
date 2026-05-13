from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

try:
    from backend.app import app
    from backend.routers import agent, protected
except ModuleNotFoundError as exc:  # pragma: no cover
    if exc.name not in {"backend", "backend.app", "backend.routers"}:
        raise
    from app import app
    from routers import agent, protected


app.title = "Songine API"
app.version = "1.0.0"
app.include_router(protected.router, prefix="/api")
app.include_router(agent.router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
