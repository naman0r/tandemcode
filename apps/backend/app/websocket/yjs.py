from __future__ import annotations

import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)

# y-websocket clients open with SyncStep1 and only consider themselves synced
# once a SyncStep2 comes back. A peer answers that when there is one; when the
# client is alone, nobody would, so the relay answers for the empty document
# it does not keep. Both are the messageSync envelope followed by the step.
SYNC_STEP1_PREFIX = b"\x00\x00"
EMPTY_SYNC_STEP2 = b"\x00\x01\x02\x00\x00"


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
        sessions = list(self.room_sessions.get(room_id, set()))
        if sessions == [sender] and payload.startswith(SYNC_STEP1_PREFIX):
            await sender.send_bytes(EMPTY_SYNC_STEP2)
            return
        for session in sessions:
            if session is sender:
                continue
            try:
                await session.send_bytes(payload)
            except Exception:
                logger.exception("Failed to relay Yjs binary message for room %s", room_id)
