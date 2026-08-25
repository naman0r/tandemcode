"""Handshake-time authentication for the websocket routes.

A browser cannot set an Authorization header on a websocket, so the session
token arrives as a query parameter instead. It is checked before accept(), so a
caller who fails these checks never gets a socket at all - the handshake itself
fails and no frame is ever exchanged.
"""

from __future__ import annotations

import logging

from fastapi import HTTPException, WebSocket

from app.core.auth import TokenError, clerk_user_id
from app.dao.rooms import RoomDAO
from app.services.rooms import ensure_room_access

logger = logging.getLogger(__name__)

_POLICY_VIOLATION = 1008


async def authenticate(websocket: WebSocket, room_id: str) -> str | None:
    """The caller's Clerk user id, or None once the handshake has been refused.

    Callers must return immediately on None; the socket is already closed.
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=_POLICY_VIOLATION, reason="Missing token")
        return None

    try:
        user_id = await clerk_user_id(token)
    except TokenError as exc:
        logger.info("Rejected websocket on room %s: %s", room_id, exc)
        await websocket.close(code=_POLICY_VIOLATION, reason="Invalid token")
        return None

    try:
        await ensure_room_access(RoomDAO(websocket.app.state.db_pool), room_id, user_id)
    except HTTPException as exc:
        logger.info("Refused %s access to room %s: %s", user_id, room_id, exc.detail)
        await websocket.close(code=_POLICY_VIOLATION, reason=exc.detail)
        return None

    return user_id
