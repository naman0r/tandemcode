from __future__ import annotations

import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class YjsRelayManager:
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

    async def relay_text(self, room_id: str, sender: WebSocket, message: str) -> None:
        for session in list(self.room_sessions.get(room_id, set())):
            if session is sender:
                continue
            try:
                await session.send_text(message)
            except Exception:
                logger.exception("Failed to relay Yjs text message for room %s", room_id)

    async def relay_bytes(self, room_id: str, sender: WebSocket, payload: bytes) -> None:
        for session in list(self.room_sessions.get(room_id, set())):
            if session is sender:
                continue
            try:
                await session.send_bytes(payload)
            except Exception:
                logger.exception("Failed to relay Yjs binary message for room %s", room_id)
