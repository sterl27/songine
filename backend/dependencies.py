from __future__ import annotations

import os
from typing import Any

from fastapi import Header, HTTPException, status
from jose import JWTError, jwt


def _get_jwt_secret() -> str:
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured",
        )
    return secret


def _get_jwt_decode_options() -> dict[str, Any]:
    issuer = os.getenv("SUPABASE_JWT_ISSUER")
    audience = os.getenv("SUPABASE_JWT_AUDIENCE")

    options: dict[str, Any] = {
        "verify_aud": bool(audience),
        "require_exp": True,
        "require_sub": True,
    }

    decode_options: dict[str, Any] = {
        "algorithms": ["HS256"],
        "options": options,
    }

    if issuer:
        decode_options["issuer"] = issuer
    if audience:
        decode_options["audience"] = audience

    return decode_options


async def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = authorization.replace("Bearer ", "", 1).strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    try:
        payload = jwt.decode(
            token,
            _get_jwt_secret(),
            **_get_jwt_decode_options(),
        )

        if not payload.get("sub"):
            raise JWTError("Token missing subject claim")

        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc
