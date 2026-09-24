"""The Yjs relay: forwards between peers, and stands in for one when alone."""

from __future__ import annotations

import pytest
from starlette.websockets import WebSocketDisconnect

from app.websocket.yjs import EMPTY_SYNC_STEP2, SYNC_REQUEST_BURST
from tests.rig import auth, room_socket, roster, token

# messageSync, SyncStep1, then a state vector for an empty document.
SYNC_STEP1 = bytes([0, 0, 1, 0])
UPDATE = bytes([0, 2, 3, 1, 2, 3])


def yjs_socket(client, room_id: str, user_id: str):
    return client.websocket_connect(f"/ws/yjs/{room_id}?token={token(user_id)}")


def test_lone_client_is_answered_with_an_empty_document(client, room):
    with room_socket(client, room["id"], "user_alice"), yjs_socket(client, room["id"], "user_alice") as alice:
        alice.send_bytes(SYNC_STEP1)
        assert alice.receive_bytes() == EMPTY_SYNC_STEP2


def test_peer_answers_when_one_is_present(client, room):
    with room_socket(client, room["id"], "user_alice"), room_socket(client, room["id"], "user_bob"):
        with yjs_socket(client, room["id"], "user_alice") as alice:
            with yjs_socket(client, room["id"], "user_bob") as bob:
                bob.send_bytes(SYNC_STEP1)
                # Alice, not the relay, gets to describe the document.
                assert alice.receive_bytes() == SYNC_STEP1

                alice.send_bytes(UPDATE)
                assert bob.receive_bytes() == UPDATE


def test_editor_is_refused_to_someone_not_in_the_room(client, room):
    with pytest.raises(WebSocketDisconnect):
        with yjs_socket(client, room["id"], "user_bob"):
            pass


def test_leaving_closes_the_editor_socket(client, room):
    with room_socket(client, room["id"], "user_alice") as chat:
        roster(chat)
        with room_socket(client, room["id"], "user_bob") as bob_chat, yjs_socket(client, room["id"], "user_bob") as bob:
            roster(bob_chat)
            client.post(f"/api/rooms/{room['id']}/leave", headers=auth("user_bob"))
            with pytest.raises(WebSocketDisconnect):
                bob.receive_bytes()


@pytest.mark.parametrize(
    "frame",
    [
        bytes([0, 2, 5, 1, 2]),
        bytes([0, 2, 1, 1, 2]),
        bytes([0, 7, 1, 1]),
        bytes([0, 2]),
        bytes([0, 2, 0]),
        bytes([0x80, 0x00, 0x02, 0x00]),
        bytes([3]),
    ],
    ids=["short-body", "trailing-bytes", "unknown-step", "no-length", "empty-body", "padded-type", "query-awareness"],
)
def test_malformed_frames_are_refused(client, room, frame):
    with room_socket(client, room["id"], "user_alice"), yjs_socket(client, room["id"], "user_alice") as alice:
        alice.send_bytes(frame)
        with pytest.raises(WebSocketDisconnect):
            alice.receive_bytes()


def test_editor_messages_are_classified_by_their_decoded_values():
    from app.websocket.yjs import AWARENESS, EMPTY_SYNC_STEP2, SYNC_STEP1 as STEP1, SYNC_STEP2, SYNC_UPDATE, classify

    assert classify(SYNC_STEP1) == STEP1
    assert classify(EMPTY_SYNC_STEP2) == SYNC_STEP2
    assert classify(UPDATE) == SYNC_UPDATE
    assert classify(bytes([1, 0])) == AWARENESS
    # A 200-byte body needs a two-byte length.
    assert classify(bytes([0, 2, 0xC8, 0x01]) + bytes(200)) == SYNC_UPDATE
    # Padding a varuint does not change what lib0 reads, so it cannot change
    # what the relay decides either.
    assert classify(bytes([0x80, 0x00, 0x80, 0x00, 1, 0])) == STEP1


def test_padded_sync_requests_count_against_the_limit(client, room):
    padded = bytes([0x80, 0x00, 0x80, 0x00, 1, 0])
    with room_socket(client, room["id"], "user_alice"), yjs_socket(client, room["id"], "user_alice") as alice:
        for _ in range(SYNC_REQUEST_BURST):
            alice.send_bytes(padded)
            assert alice.receive_bytes() == EMPTY_SYNC_STEP2
        alice.send_bytes(padded)
        with pytest.raises(WebSocketDisconnect):
            alice.receive_bytes()


def test_text_frames_are_refused(client, room):
    with room_socket(client, room["id"], "user_alice"), yjs_socket(client, room["id"], "user_alice") as alice:
        alice.send_text("hello")
        with pytest.raises(WebSocketDisconnect):
            alice.receive_bytes()


def test_a_socket_past_its_byte_budget_is_closed(client, room):
    # A well-framed update of 256 KB, the largest frame there is: four of them
    # are the whole burst.
    body = 256 * 1024 - 5
    big = bytes([0, 2, 0x80 | body & 0x7F, 0x80 | body >> 7 & 0x7F, body >> 14]) + bytes(body)
    with room_socket(client, room["id"], "user_alice"), yjs_socket(client, room["id"], "user_alice") as alice:
        for _ in range(4):
            alice.send_bytes(big)
        alice.send_bytes(SYNC_STEP1)
        assert alice.receive_bytes() == EMPTY_SYNC_STEP2
        alice.send_bytes(big)
        with pytest.raises(WebSocketDisconnect):
            alice.receive_bytes()


def test_a_flood_of_sync_requests_closes_the_socket_and_reconnecting_does_not_reset_it(client, room):
    with room_socket(client, room["id"], "user_alice"):
        with yjs_socket(client, room["id"], "user_alice") as alice:
            for _ in range(SYNC_REQUEST_BURST):
                alice.send_bytes(SYNC_STEP1)
                assert alice.receive_bytes() == EMPTY_SYNC_STEP2
        with yjs_socket(client, room["id"], "user_alice") as again:
            again.send_bytes(SYNC_STEP1)
            with pytest.raises(WebSocketDisconnect):
                again.receive_bytes()


def test_simultaneous_editor_handshakes_cannot_pass_the_cap_together():
    import asyncio

    from app.websocket.room_chat import MAX_SOCKETS_PER_USER
    from app.websocket.yjs import YjsRelayManager
    from fastapi import WebSocketException

    class Presence:
        async def is_present(self, room_id, user_id):
            return True

    class Socket:
        async def accept(self):
            await asyncio.sleep(0)

    manager = YjsRelayManager(updates=None)

    async def handshake():
        try:
            await manager.connect(Socket(), "r", "user_alice", Presence())
            return True
        except WebSocketException:
            return False

    async def burst():
        return await asyncio.gather(*(handshake() for _ in range(50)))

    assert sum(asyncio.run(burst())) == MAX_SOCKETS_PER_USER

