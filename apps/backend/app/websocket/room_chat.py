from __future__ import annotations

import json
import logging
import time
from collections import defaultdict, deque
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketException, status
from fastapi.encoders import jsonable_encoder

from app.dao.events import EventDAO
from app.dao.room_members import RoomMemberDAO
from app.websocket.auth import Participant
from app.websocket.fanout import close_all, fan_out

logger = logging.getLogger(__name__)

MAX_CHAT_CHARS = 2000
# Ten messages in ten seconds is a fast typist; past that it is a script.
CHAT_BURST = 10
CHAT_WINDOW_SECONDS = 10.0
# A long session is a few hundred messages. Past this a room's chat is closed,
# so no one can grow a replay without bound.
MAX_CHAT_MESSAGES_PER_ROOM = 2000
# Two tabs and a reconnect that overlaps the socket it replaces.
MAX_SOCKETS_PER_USER = 3
# Across every room: enough for a few rooms open in tabs, far short of the
# server's connection limit however many rooms one account can enter.
MAX_SOCKETS_PER_USER_TOTAL = 10


class RoomChatManager:
    """Live chat sockets for a room, plus the presence rows that mirror them.

    One user can hold several sockets on the same room at once - two tabs, or a
    reconnect that overlaps the socket it replaces. Sessions are therefore keyed
    by socket with the owning participant attached, so presence survives until
    that user's last socket for the room has gone.
    """

    def __init__(self, events: EventDAO) -> None:
        self.room_sessions: dict[str, dict[WebSocket, Participant]] = defaultdict(dict)
        self.events = events
        # Per user, so opening more sockets does not buy more messages.
        # ponytail: never pruned, one small deque per user who ever chatted.
        self.recent_sends: dict[str, deque[float]] = defaultdict(deque)
        # Sockets that stopped taking frames; skipped until they are forgotten.
        self.stalled: set[WebSocket] = set()

    async def join(
        self,
        websocket: WebSocket,
        room_id: str,
        participant: Participant,
        room_member_dao: RoomMemberDAO,
    ) -> None:
        # Every join rebroadcasts the roster to every socket in the room, so an
        # unbounded number of sockets from one user is quadratic work.
        # Counted and recorded with no await in between, so handshakes that
        # arrive together cannot all pass the check.
        users = [
            (room, other.user_id)
            for room, sessions in self.room_sessions.items()
            for other in sessions.values()
            if other.user_id == participant.user_id
        ]
        if (
            sum(1 for room, _ in users if room == room_id) >= MAX_SOCKETS_PER_USER
            or len(users) >= MAX_SOCKETS_PER_USER_TOTAL
        ):
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Too many connections")

        # Recorded before the first await, so anything that fails below unwinds
        # through _forget rather than stranding a half-joined socket.
        self.room_sessions[room_id][websocket] = participant

        try:
            joined = await room_member_dao.add_member(room_id, participant.user_id)
        except Exception:
            self._forget(websocket, room_id)
            raise

        # Presence is not best-effort: room closure is decided from this table,
        # so a socket that is not in it must not exist.
        if not joined:
            self._forget(websocket, room_id)
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION, reason="Room is closed"
            )

        await websocket.accept()

        # A refresh should not wipe the conversation. History goes to this
        # socket alone, before presence, so the client sees it as the past.
        for message in await self.events.recent_chat(room_id):
            await websocket.send_text(json.dumps(message))

        # After accept so the joiner is in the roster it receives.
        await self._broadcast_presence(room_id, room_member_dao)

    async def leave(
        self,
        websocket: WebSocket,
        room_id: str,
        room_member_dao: RoomMemberDAO,
    ) -> None:
        participant = self._forget(websocket, room_id)
        if participant is None:
            return

        still_connected = {
            session.user_id for session in self.room_sessions.get(room_id, {}).values()
        }
        if participant.user_id not in still_connected:
            try:
                # close_if_empty stays off: losing a connection is not leaving.
                await room_member_dao.remove_member(room_id, participant.user_id)
            except Exception:
                logger.exception(
                    "Failed to remove room member user_id=%s room_id=%s",
                    participant.user_id,
                    room_id,
                )

        await self._broadcast_presence(room_id, room_member_dao)

    async def relay_chat(self, room_id: str, websocket: WebSocket, raw: str) -> None:
        """Rebroadcast a chat message around its authenticated sender.

        The client supplies text and nothing else. Identity, display name and
        timestamp are the server's, so nobody can post as somebody else.
        """
        sender = self.room_sessions.get(room_id, {}).get(websocket)
        if sender is None:
            return

        try:
            incoming = json.loads(raw)
        except ValueError:
            return

        if not isinstance(incoming, dict) or incoming.get("type") != "chat":
            return

        text = incoming.get("text")
        if not isinstance(text, str) or not text.strip() or len(text) > MAX_CHAT_CHARS:
            return
        if not self._within_rate(sender.user_id):
            return

        message = {
            "type": "chat",
            "userId": sender.user_id,
            "username": sender.display_name,
            "text": text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if await self.events.record(room_id, "chat", message, MAX_CHAT_MESSAGES_PER_ROOM):
            await self.broadcast(room_id, message)

    async def close_user(
        self,
        room_id: str,
        user_id: str,
        room_member_dao: RoomMemberDAO,
    ) -> None:
        """Close every socket an explicit leave just removed from the room."""
        sessions = [
            websocket
            for websocket, participant in self.room_sessions.get(room_id, {}).items()
            if participant.user_id == user_id
        ]
        if not sessions:
            return

        for websocket in sessions:
            self._forget(websocket, room_id)
        await close_all(sessions)

        await self._broadcast_presence(room_id, room_member_dao)

    def _within_rate(self, user_id: str) -> bool:
        now = time.monotonic()
        sends = self.recent_sends[user_id]
        while sends and now - sends[0] > CHAT_WINDOW_SECONDS:
            sends.popleft()
        if len(sends) >= CHAT_BURST:
            return False
        sends.append(now)
        return True

    def _forget(self, websocket: WebSocket, room_id: str) -> Participant | None:
        self.stalled.discard(websocket)
        sessions = self.room_sessions.get(room_id)
        if sessions is None:
            return None

        participant = sessions.pop(websocket, None)
        if not sessions:
            self.room_sessions.pop(room_id, None)
        return participant

    async def _broadcast_presence(
        self,
        room_id: str,
        room_member_dao: RoomMemberDAO,
    ) -> None:
        """Push the whole roster rather than a delta, so a client that missed an
        event still converges on the next one."""
        try:
            members = await room_member_dao.list_members(room_id)
        except Exception:
            logger.exception("Failed to read members for room %s", room_id)
            return

        await self.broadcast(room_id, {"type": "presence", "members": members})

    async def broadcast(self, room_id: str, event: dict) -> None:
        # The same encoder as HTTP responses: clients sort runs by comparing
        # createdAt strings, so both paths must render datetimes identically.
        message = json.dumps(jsonable_encoder(event))
        await fan_out(
            list(self.room_sessions.get(room_id, {})),
            lambda session: session.send_text(message),
            self.stalled,
        )
