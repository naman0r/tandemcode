"""Handshake-time authentication for the websocket routes.

A browser cannot set an Authorization header on a websocket, so the session
token arrives as a query parameter instead. It is checked before accept(), so a
caller who fails never gets a socket at all - the handshake itself fails and no
frame is ever exchanged.
"""

from __future__ import annotations

import logging
from typing import NamedTuple

from fastapi import HTTPException, Query, WebSocket, WebSocketException, status

from app.core.auth import TokenError, clerk_user_id
from app.dao.rooms import RoomDAO
from app.dao.users import UserDAO
from app.services.rooms import get_active_room

logger = logging.getLogger(__name__)


class Participant(NamedTuple):
    """An authenticated caller, and the name the server will speak for them."""

    user_id: str
    display_name: str


async def room_participant(
    websocket: WebSocket,
    room_id: str,
    token: str | None = Query(default=None),
) -> Participant:
    """Resolve the caller, or refuse the handshake.

    A dependency rather than a helper so that a websocket route cannot be added
    without it: leaving it out is a missing argument, not an open socket.
    """
    if not token:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Missing token"
        )

    try:
        user_id = await clerk_user_id(token)
    except TokenError as exc:
        logger.info("Rejected websocket on room %s: %s", room_id, exc)
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token"
        ) from exc

    pool = websocket.app.state.db_pool

    # Presence has a foreign key to users. Resolving the caller here turns
    # "never synced" into a refused handshake, rather than an insert that fails
    # once the socket is already live and there is nothing useful left to do.
    user = await UserDAO(pool).get_by_id(user_id)
    if not user:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="User has not been synced"
        )

    try:
        await get_active_room(RoomDAO(pool), room_id)
    except HTTPException as exc:
        logger.info("Refused %s access to room %s: %s", user_id, room_id, exc.detail)
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason=exc.detail
        ) from exc

    return Participant(user_id=user_id, display_name=user["name"] or "Someone")
