from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

try:
    from backend.dependencies import get_current_user
except ModuleNotFoundError as exc:  # pragma: no cover
    if exc.name not in {"backend", "backend.dependencies"}:
        raise
    from dependencies import get_current_user

router = APIRouter(tags=["protected"])


@router.get("/me")
async def get_me(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return {
        "user_id": user.get("sub"),
        "email": user.get("email"),
        "role": user.get("role"),
    }
