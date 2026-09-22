from __future__ import annotations

import json
import logging
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketException, status

from app.dao.room_members import RoomMemberDAO
from app.websocket.auth import Participant

logger = logging.getLogger(__name__)


class RoomChatManager:
    """Live chat sockets for a room, plus the presence rows that mirror them.

    One user can hold several sockets on the same room at once - two tabs, or a
    reconnect that overlaps the socket it replaces. Sessions are therefore keyed
    by socket with the owning participant attached, so presence survives until
    that user's last socket for the room has gone.
    """

    def __init__(self) -> None:
        self.room_sessions: dict[str, dict[WebSocket, Participant]] = defaultdict(dict)

    async def join(
        self,
        websocket: WebSocket,
        room_id: str,
        participant: Participant,
        room_member_dao: RoomMemberDAO,
    ) -> None:
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
        if not isinstance(text, str) or not text.strip():
            return

        await self._broadcast(
            room_id,
            {
                "type": "chat",
                "userId": sender.user_id,
                "username": sender.display_name,
                "text": text,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

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
            await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)

        await self._broadcast_presence(room_id, room_member_dao)

    def _forget(self, websocket: WebSocket, room_id: str) -> Participant | None:
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

        await self._broadcast(room_id, {"type": "presence", "members": members})

    async def _broadcast(self, room_id: str, event: dict) -> None:
        # default=str renders joined_at, which is a datetime.
        message = json.dumps(event, default=str)
        for session in list(self.room_sessions.get(room_id, {})):
            try:
                await session.send_text(message)
            except Exception:
                logger.exception("Failed to send to a socket in room %s", room_id)
