"""One peer that stops reading must not stall a room's broadcasts."""

from __future__ import annotations

import asyncio
import time

from app.websocket import fanout
from app.websocket.auth import Participant
from app.websocket.room_chat import RoomChatManager
from app.websocket.yjs import YjsRelayManager

AWARENESS = bytes([1, 0])


class Peer:
    def __init__(self, stalled: bool = False) -> None:
        self.stalled = stalled
        self.received: list = []
        self.closed = False

    async def _take(self, frame) -> None:
        if self.stalled:
            await asyncio.Event().wait()
        self.received.append(frame)

    async def send_text(self, frame: str) -> None:
        await self._take(frame)

    async def send_bytes(self, frame: bytes) -> None:
        await self._take(frame)

    async def close(self, code: int = 1000) -> None:
        self.closed = True
        # A stuck writer cannot send a close frame any more than a message.
        if self.stalled:
            await asyncio.Event().wait()


def test_a_stalled_peer_is_dropped_and_the_rest_still_hear_chat(monkeypatch):
    monkeypatch.setattr(fanout, "SEND_TIMEOUT_SECONDS", 0.1)
    manager = RoomChatManager(events=None)
    stuck, alice, bob = Peer(stalled=True), Peer(), Peer()
    for peer, user in ((stuck, "user_x"), (alice, "user_alice"), (bob, "user_bob")):
        manager.room_sessions["r"][peer] = Participant(user, user)

    async def two_broadcasts():
        started = time.monotonic()
        await manager.broadcast("r", {"type": "chat", "text": "one"})
        first = time.monotonic() - started
        await manager.broadcast("r", {"type": "chat", "text": "two"})
        return first, time.monotonic() - started - first

    first, second = asyncio.run(two_broadcasts())
    assert len(alice.received) == len(bob.received) == 2
    assert stuck.closed and stuck in manager.stalled
    # One deadline the first time, not a second one waiting on the close, and
    # none once the peer is known to be stalled.
    assert first < 0.18 and second < 0.05


def test_a_stalled_editor_peer_does_not_hold_the_relay(monkeypatch):
    monkeypatch.setattr(fanout, "SEND_TIMEOUT_SECONDS", 0.1)
    manager = YjsRelayManager(updates=None)
    sender, stuck, bob = Peer(), Peer(stalled=True), Peer()
    for peer, user in ((sender, "user_alice"), (stuck, "user_x"), (bob, "user_bob")):
        manager.room_sessions["r"][peer] = user

    async def relay_then_yield():
        await manager.relay_bytes("r", sender, AWARENESS)
        # The close runs in the background; let it start.
        await asyncio.sleep(0)

    asyncio.run(relay_then_yield())
    assert bob.received == [AWARENESS] and sender.received == []
    assert stuck.closed


def test_closing_a_room_does_not_wait_on_a_stalled_peer(monkeypatch):
    monkeypatch.setattr(fanout, "SEND_TIMEOUT_SECONDS", 0.1)
    manager = YjsRelayManager(updates=None)
    peers = [Peer(stalled=True), Peer(stalled=True), Peer()]
    for index, peer in enumerate(peers):
        manager.room_sessions["r"][peer] = f"user_{index}"

    started = time.monotonic()
    asyncio.run(manager.close_room("r"))
    assert all(peer.closed for peer in peers) and "r" not in manager.room_sessions
    # Side by side: one deadline, not one per stalled peer.
    assert time.monotonic() - started < 0.18
