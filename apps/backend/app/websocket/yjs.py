from __future__ import annotations

import contextlib
import time
from collections import defaultdict, deque

from fastapi import WebSocket, WebSocketException, status

from app.dao.room_members import RoomMemberDAO
from app.dao.room_updates import RoomUpdateDAO
from app.websocket.fanout import fan_out
from app.websocket.room_chat import MAX_SOCKETS_PER_USER, MAX_SOCKETS_PER_USER_TOTAL

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
# but stops recording, so no one socket can fill the disk, and a replay stays
# small enough to send in one response.
MAX_RECORDED_BYTES_PER_ROOM = 4 * 1024 * 1024

# Each keystroke is an edit and a cursor move, so a held key auto-repeating
# is some 60 frames a second. A socket past that for ten seconds is a script,
# and it is closed; y-websocket reconnects and resyncs.
FRAME_BURST = 600
FRAME_WINDOW_SECONDS = 10.0
# SyncStep1 asks every peer for its whole document, so it is sent on connect
# and not again. A handful covers reconnects; a flood would replay documents.
SYNC_REQUEST_BURST = 5
SYNC_REQUEST_WINDOW_SECONDS = 60.0


def _read_varuint(data: bytes, offset: int) -> tuple[int, int] | None:
    """lib0's variable-length unsigned int: 7 bits a byte, low bits first."""
    value, shift = 0, 0
    while offset < len(data) and shift < 35:
        byte = data[offset]
        value |= (byte & 0x7F) << shift
        offset += 1
        if byte < 0x80:
            return value, offset
        shift += 7
    return None


def is_well_framed_sync(payload: bytes) -> bool:
    """A sync message: type 0, step 0 to 2, then one length-prefixed body.

    This checks the envelope, not the Yjs update inside it, which is enough
    to refuse bytes that merely start like a sync message.
    """
    offset = 0
    for allowed in ({0}, {0, 1, 2}):
        read = _read_varuint(payload, offset)
        if read is None or read[0] not in allowed:
            return False
        offset = read[1]
    read = _read_varuint(payload, offset)
    return read is not None and read[1] + read[0] == len(payload)


class YjsRelayManager:
    def __init__(self, updates: RoomUpdateDAO) -> None:
        # Socket to the user it belongs to, so a leave can close that user's.
        self.room_sessions: dict[str, dict[WebSocket, str]] = defaultdict(dict)
        self.updates = updates
        # Sockets that stopped taking frames; skipped until they disconnect.
        self.stalled: set[WebSocket] = set()
        self.frames: dict[WebSocket, deque[float]] = defaultdict(deque)
        self.sync_requests: dict[WebSocket, deque[float]] = defaultdict(deque)

    async def connect(
        self, websocket: WebSocket, room_id: str, user_id: str, room_member_dao: RoomMemberDAO
    ) -> None:
        # The editor belongs to the people on the roster. The room socket puts
        # you there; until it has, this is refused and y-websocket retries.
        if not await room_member_dao.is_present(room_id, user_id):
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Not in the room")
        # Counted and recorded with no await in between, so handshakes that
        # arrive together cannot all pass the check.
        rooms = [room for room, sessions in self.room_sessions.items() for owner in sessions.values() if owner == user_id]
        if rooms.count(room_id) >= MAX_SOCKETS_PER_USER or len(rooms) >= MAX_SOCKETS_PER_USER_TOTAL:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Too many connections")
        self.room_sessions[room_id][websocket] = user_id
        try:
            await websocket.accept()
        except Exception:
            self.disconnect(websocket, room_id)
            raise

    def disconnect(self, websocket: WebSocket, room_id: str) -> None:
        self.stalled.discard(websocket)
        self.frames.pop(websocket, None)
        self.sync_requests.pop(websocket, None)
        sessions = self.room_sessions.get(room_id)
        if not sessions:
            return
        sessions.pop(websocket, None)
        if not sessions:
            self.room_sessions.pop(room_id, None)

    async def close_user(self, room_id: str, user_id: str) -> None:
        for websocket, owner in list(self.room_sessions.get(room_id, {}).items()):
            if owner == user_id:
                await self._close(websocket, room_id)

    async def close_room(self, room_id: str) -> None:
        for websocket in list(self.room_sessions.get(room_id, {})):
            await self._close(websocket, room_id)

    async def _close(self, websocket: WebSocket, room_id: str) -> None:
        self.disconnect(websocket, room_id)
        # A peer that dropped a moment ago must not stop the rest being closed.
        with contextlib.suppress(Exception):
            await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)

    def _peers(self, room_id: str, sender: WebSocket) -> list[WebSocket]:
        return [session for session in self.room_sessions.get(room_id, {}) if session is not sender]

    async def relay_text(self, room_id: str, sender: WebSocket, message: str) -> None:
        if not _within(self.frames[sender], FRAME_BURST, FRAME_WINDOW_SECONDS):
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Too many frames")
        await fan_out(self._peers(room_id, sender), lambda session: session.send_text(message), self.stalled)

    async def relay_bytes(self, room_id: str, sender: WebSocket, payload: bytes) -> None:
        if len(payload) > MAX_FRAME_BYTES:
            raise WebSocketException(code=status.WS_1009_MESSAGE_TOO_BIG, reason="Frame too large")
        if not _within(self.frames[sender], FRAME_BURST, FRAME_WINDOW_SECONDS):
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Too many frames")
        if payload.startswith(b"\x00"):
            # Relayed to every peer and stored for replay, so it has to be one.
            if not is_well_framed_sync(payload):
                raise WebSocketException(code=status.WS_1003_UNSUPPORTED_DATA, reason="Malformed sync message")
            if payload.startswith(SYNC_STEP1_PREFIX) and not _within(
                self.sync_requests[sender], SYNC_REQUEST_BURST, SYNC_REQUEST_WINDOW_SECONDS
            ):
                raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Too many sync requests")
        sessions = list(self.room_sessions.get(room_id, {}))
        if sessions == [sender] and payload.startswith(SYNC_STEP1_PREFIX):
            await sender.send_bytes(EMPTY_SYNC_STEP2)
            return
        await fan_out(self._peers(room_id, sender), lambda session: session.send_bytes(payload), self.stalled)
        # After the relay so a slow disk never delays a keystroke reaching a peer.
        if payload.startswith(DOCUMENT_CHANGE_PREFIXES):
            await self.updates.record(room_id, payload, MAX_RECORDED_BYTES_PER_ROOM)


def _within(sent: deque[float], burst: int, window: float) -> bool:
    now = time.monotonic()
    while sent and now - sent[0] > window:
        sent.popleft()
    if len(sent) >= burst:
        return False
    sent.append(now)
    return True
