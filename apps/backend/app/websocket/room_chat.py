from __future__ import annotations

import logging
from collections import defaultdict

from fastapi import WebSocket

from app.dao.room_members import RoomMemberDAO

logger = logging.getLogger(__name__)


class RoomChatManager:
    def __init__(self) -> None:
        self.room_sessions: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, room_id: str) -> None:
        await websocket.accept()
        self.room_sessions[room_id].add(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str) -> None:
        sessions = self.room_sessions.get(room_id)
        if not sessions:
            return
        sessions.discard(websocket)
        if not sessions:
            self.room_sessions.pop(room_id, None)

    async def broadcast(self, room_id: str, message: str) -> None:
        sessions = list(self.room_sessions.get(room_id, set()))
        for session in sessions:
            try:
                await session.send_text(message)
            except Exception:
                logger.exception("Failed to send chat message to room %s", room_id)

    async def add_member_if_possible(
        self,
        room_member_dao: RoomMemberDAO,
        room_id: str,
        user_id: str | None,
    ) -> None:
        if not user_id:
            return
        try:
            await room_member_dao.add_member(room_id, user_id)
        except Exception:
            logger.exception("Failed to add room member user_id=%s room_id=%s", user_id, room_id)

    async def remove_member_if_possible(
        self,
        room_member_dao: RoomMemberDAO,
        room_id: str,
        user_id: str | None,
    ) -> None:
        if not user_id:
            return
        try:
            await room_member_dao.remove_member(room_id, user_id)
        except Exception:
            logger.exception("Failed to remove room member user_id=%s room_id=%s", user_id, room_id)
