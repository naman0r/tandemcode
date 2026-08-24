from __future__ import annotations

import logging
from collections import defaultdict

from fastapi import WebSocket

from app.dao.room_members import RoomMemberDAO

logger = logging.getLogger(__name__)


class RoomChatManager:
    """Live chat sockets for a room, plus the presence rows that mirror them.

    One user can hold several sockets on the same room at once - two tabs, or a
    reconnect that overlaps the socket it replaces. Sessions are therefore keyed
    by socket with the owning user attached, so presence survives until that
    user's last socket for the room has gone.
    """

    def __init__(self) -> None:
        self.room_sessions: dict[str, dict[WebSocket, str | None]] = defaultdict(dict)

    async def join(
        self,
        websocket: WebSocket,
        room_id: str,
        user_id: str | None,
        room_member_dao: RoomMemberDAO,
    ) -> None:
        # Presence is written before the handshake completes, so a GET /members
        # issued the moment the socket opens already sees this user.
        if user_id:
            try:
                await room_member_dao.add_member(room_id, user_id)
            except Exception:
                logger.exception(
                    "Failed to add room member user_id=%s room_id=%s", user_id, room_id
                )

        await websocket.accept()
        self.room_sessions[room_id][websocket] = user_id

    async def leave(
        self,
        websocket: WebSocket,
        room_id: str,
        room_member_dao: RoomMemberDAO,
    ) -> None:
        sessions = self.room_sessions.get(room_id)
        if sessions is None:
            return

        user_id = sessions.pop(websocket, None)
        still_connected = set(sessions.values())
        if not sessions:
            self.room_sessions.pop(room_id, None)

        if user_id and user_id not in still_connected:
            try:
                await room_member_dao.remove_member(room_id, user_id)
            except Exception:
                logger.exception(
                    "Failed to remove room member user_id=%s room_id=%s", user_id, room_id
                )

    async def broadcast(self, room_id: str, message: str) -> None:
        for session in list(self.room_sessions.get(room_id, {})):
            try:
                await session.send_text(message)
            except Exception:
                logger.exception("Failed to send chat message to room %s", room_id)
