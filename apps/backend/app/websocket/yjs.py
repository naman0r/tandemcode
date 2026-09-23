from __future__ import annotations

import logging
from collections import defaultdict

from fastapi import WebSocket, WebSocketException, status

from app.dao.room_members import RoomMemberDAO
from app.dao.room_updates import RoomUpdateDAO

logger = logging.getLogger(__name__)

# y-websocket clients open with SyncStep1 and only consider themselves synced
# once a SyncStep2 comes back. A peer answers that when there is one; when the
# client is alone, nobody would, so the relay answers for the empty document
# it does not keep. Both are the messageSync envelope followed by the step.
SYNC_STEP1_PREFIX = b"\x00\x00"
EMPTY_SYNC_STEP2 = b"\x00\x01\x02\x00\x00"

# SyncStep2 and Update both carry document changes; those are what a replay
# needs. SyncStep1 is a request and awareness (message type 1) is cursors.
DOCUMENT_CHANGE_PREFIXES = (b"\x00\x01", b"\x00\x02")

# A full sync of a long solution is tens of kilobytes. Anything near this is
# not an editor and every frame is stored, so the socket is closed instead.
MAX_FRAME_BYTES = 256 * 1024

# A long session stores well under a megabyte. Past this a room keeps relaying
# but stops recording, so no one socket can fill the disk.
# ponytail: counted per process, so a restart resets it.
MAX_RECORDED_BYTES_PER_ROOM = 16 * 1024 * 1024


class YjsRelayManager:
    def __init__(self, updates: RoomUpdateDAO) -> None:
        # Socket to the user it belongs to, so a leave can close that user's.
        self.room_sessions: dict[str, dict[WebSocket, str]] = defaultdict(dict)
        self.recorded_bytes: dict[str, int] = defaultdict(int)
        self.updates = updates

    async def connect(
        self, websocket: WebSocket, room_id: str, user_id: str, room_member_dao: RoomMemberDAO
    ) -> None:
        # The editor belongs to the people on the roster. The room socket puts
        # you there; until it has, this is refused and y-websocket retries.
        if not await room_member_dao.is_present(room_id, user_id):
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Not in the room")
        await websocket.accept()
        self.room_sessions[room_id][websocket] = user_id

    def disconnect(self, websocket: WebSocket, room_id: str) -> None:
        sessions = self.room_sessions.get(room_id)
        if not sessions:
            return
        sessions.pop(websocket, None)
        if not sessions:
            self.room_sessions.pop(room_id, None)

    async def close_user(self, room_id: str, user_id: str) -> None:
        for websocket, owner in list(self.room_sessions.get(room_id, {}).items()):
            if owner == user_id:
                self.disconnect(websocket, room_id)
                await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)

    async def close_room(self, room_id: str) -> None:
        for websocket in list(self.room_sessions.get(room_id, {})):
            self.disconnect(websocket, room_id)
            await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)

    async def relay_text(self, room_id: str, sender: WebSocket, message: str) -> None:
        for session in list(self.room_sessions.get(room_id, {})):
            if session is sender:
                continue
            try:
                await session.send_text(message)
            except Exception:
                logger.exception("Failed to relay Yjs text message for room %s", room_id)

    async def relay_bytes(self, room_id: str, sender: WebSocket, payload: bytes) -> None:
        if len(payload) > MAX_FRAME_BYTES:
            raise WebSocketException(code=status.WS_1009_MESSAGE_TOO_BIG, reason="Frame too large")
        sessions = list(self.room_sessions.get(room_id, {}))
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
        # After the relay so a slow disk never delays a keystroke reaching a peer.
        if not payload.startswith(DOCUMENT_CHANGE_PREFIXES):
            return
        if self.recorded_bytes[room_id] + len(payload) > MAX_RECORDED_BYTES_PER_ROOM:
            logger.warning("Room %s reached its replay size limit; not recording", room_id)
            return
        self.recorded_bytes[room_id] += len(payload)
        await self.updates.record(room_id, payload)
