from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import WebSocket, WebSocketException, status

from app.dao.room_members import RoomMemberDAO
from app.dao.room_updates import RoomUpdateDAO
from app.websocket.fanout import close_all, fan_out
from app.websocket.room_chat import MAX_SOCKETS_PER_USER, MAX_SOCKETS_PER_USER_TOTAL

# y-websocket clients open with SyncStep1 and only consider themselves synced
# once a SyncStep2 comes back. A peer answers that when there is one; when the
# client is alone, nobody would, so the relay answers for the empty document
# it does not keep.
EMPTY_SYNC_STEP2 = b"\x00\x01\x02\x00\x00"

# The two messages an editor sends: sync (type 0) and awareness (type 1,
# cursors). A sync message is SyncStep1, a request for the peer's document;
# SyncStep2, the reply; or an Update. The last two are what a replay needs.
SYNC_STEP1, SYNC_STEP2, SYNC_UPDATE, AWARENESS = "step1", "step2", "update", "awareness"

# A full sync of a long solution is tens of kilobytes. Anything near this is
# not an editor and every frame is stored, so the socket is closed instead.
MAX_FRAME_BYTES = 256 * 1024
# A cursor is a name, a colour and a selection: about a hundred bytes.
MAX_AWARENESS_BYTES = 16 * 1024

# A long session stores well under a megabyte. Past this a room keeps relaying
# but stops recording, so no one socket can fill the disk, and a replay stays
# small enough to send in one response.
MAX_RECORDED_BYTES_PER_ROOM = 4 * 1024 * 1024
# Each stored frame is charged at least this, so the budget also caps the row
# count. Charged by size alone, a stream of tiny frames would fill a room with
# a million rows that a replay then has to load. A keystroke is some 30 bytes,
# so this still leaves room for over 30,000 of them.
MIN_RECORDED_FRAME_BYTES = 128

# Each keystroke is an edit and a cursor move, and a drag-select sends a cursor
# on every mouse move, some 120 a second on a fast mouse. A socket past this
# for ten seconds is a script, and it is closed; y-websocket reconnects and
# resyncs.
FRAME_BURST = 2000
FRAME_WINDOW_SECONDS = 10.0
# Every frame goes out to every peer, so bytes are budgeted too. Typing is a
# few kilobytes a second; the burst covers a full sync or a large paste.
BYTE_BURST = 1024 * 1024
BYTES_PER_SECOND = 64 * 1024
# SyncStep1 asks every peer for its whole document, so it is sent on connect
# and not again. Counted per user, not per socket, so reconnecting does not
# reset it; a few tabs and reconnects fit, a flood would replay documents.
SYNC_REQUEST_BURST = 10
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


def classify(payload: bytes) -> str | None:
    """Which editor message this is, or None for anything else.

    Decoded rather than matched on raw bytes: lib0 reads padded varuints, so
    `80 00` is a sync message to every client even though it does not start
    with a zero byte. A sync message must be type 0, step 0 to 2, then one
    non-empty length-prefixed body; even an empty document's body is a byte.
    This checks the envelope, not the Yjs data inside it.
    """
    read = _read_varuint(payload, 0)
    if read is None:
        return None
    kind, offset = read
    if kind == 1:
        return AWARENESS
    if kind != 0:
        return None
    read = _read_varuint(payload, offset)
    if read is None or read[0] > 2:
        return None
    step, offset = read
    read = _read_varuint(payload, offset)
    if read is None or read[0] == 0 or read[1] + read[0] != len(payload):
        return None
    return (SYNC_STEP1, SYNC_STEP2, SYNC_UPDATE)[step]


class YjsRelayManager:
    def __init__(self, updates: RoomUpdateDAO) -> None:
        # Socket to the user it belongs to, so a leave can close that user's.
        self.room_sessions: dict[str, dict[WebSocket, str]] = defaultdict(dict)
        self.updates = updates
        # Sockets that stopped taking frames; skipped until they disconnect.
        self.stalled: set[WebSocket] = set()
        self.frames: dict[WebSocket, deque[float]] = defaultdict(deque)
        # Remaining bytes and when they were last topped up.
        self.byte_budgets: dict[WebSocket, tuple[float, float]] = {}
        # ponytail: never pruned, one small deque per user who ever edited.
        self.sync_requests: dict[str, deque[float]] = defaultdict(deque)

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
        self.byte_budgets.pop(websocket, None)
        sessions = self.room_sessions.get(room_id)
        if not sessions:
            return
        sessions.pop(websocket, None)
        if not sessions:
            self.room_sessions.pop(room_id, None)

    async def close_user(self, room_id: str, user_id: str) -> None:
        sessions = self.room_sessions.get(room_id, {})
        await self._close([websocket for websocket, owner in sessions.items() if owner == user_id], room_id)

    async def close_room(self, room_id: str) -> None:
        await self._close(list(self.room_sessions.get(room_id, {})), room_id)

    async def _close(self, websockets: list[WebSocket], room_id: str) -> None:
        for websocket in websockets:
            self.disconnect(websocket, room_id)
        await close_all(websockets)

    def _peers(self, room_id: str, sender: WebSocket) -> list[WebSocket]:
        return [session for session in self.room_sessions.get(room_id, {}) if session is not sender]

    async def relay_bytes(self, room_id: str, sender: WebSocket, payload: bytes) -> None:
        sessions = self.room_sessions.get(room_id, {})
        user_id = sessions.get(sender)
        if user_id is None:
            # Closed by a leave while this frame was on its way.
            return
        if len(payload) > MAX_FRAME_BYTES:
            raise WebSocketException(code=status.WS_1009_MESSAGE_TOO_BIG, reason="Frame too large")
        if not _within(self.frames[sender], FRAME_BURST, FRAME_WINDOW_SECONDS) or not self._spend(
            sender, len(payload)
        ):
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Too many frames")
        # Relayed to every peer and stored for replay, so it has to be one of
        # the messages an editor sends.
        kind = classify(payload)
        if kind is None:
            raise WebSocketException(code=status.WS_1003_UNSUPPORTED_DATA, reason="Malformed message")
        if kind == AWARENESS and len(payload) > MAX_AWARENESS_BYTES:
            raise WebSocketException(code=status.WS_1009_MESSAGE_TOO_BIG, reason="Frame too large")
        if kind == SYNC_STEP1:
            if not _within(self.sync_requests[user_id], SYNC_REQUEST_BURST, SYNC_REQUEST_WINDOW_SECONDS):
                raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Too many sync requests")
            if list(sessions) == [sender]:
                await sender.send_bytes(EMPTY_SYNC_STEP2)
                return
        await fan_out(self._peers(room_id, sender), lambda session: session.send_bytes(payload), self.stalled)
        # After the relay so a slow disk never delays a keystroke reaching a peer.
        if kind in (SYNC_STEP2, SYNC_UPDATE):
            await self.updates.record(room_id, payload, MAX_RECORDED_BYTES_PER_ROOM, MIN_RECORDED_FRAME_BYTES)

    def _spend(self, websocket: WebSocket, size: int) -> bool:
        now = time.monotonic()
        remaining, topped_up = self.byte_budgets.get(websocket, (BYTE_BURST, now))
        remaining = min(BYTE_BURST, remaining + (now - topped_up) * BYTES_PER_SECOND) - size
        if remaining < 0:
            return False
        self.byte_budgets[websocket] = (remaining, now)
        return True


def _within(sent: deque[float], burst: int, window: float) -> bool:
    now = time.monotonic()
    while sent and now - sent[0] > window:
        sent.popleft()
    if len(sent) >= burst:
        return False
    sent.append(now)
    return True
