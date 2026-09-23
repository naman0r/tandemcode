"""The Yjs relay: forwards between peers, and stands in for one when alone."""

from __future__ import annotations

from app.websocket.yjs import EMPTY_SYNC_STEP2
from tests.rig import token

# messageSync, SyncStep1, then a state vector for an empty document.
SYNC_STEP1 = bytes([0, 0, 1, 0])
UPDATE = bytes([0, 2, 3, 1, 2, 3])


def yjs_socket(client, room_id: str, user_id: str):
    return client.websocket_connect(f"/ws/yjs/{room_id}?token={token(user_id)}")


def test_lone_client_is_answered_with_an_empty_document(client, room):
    with yjs_socket(client, room["id"], "user_alice") as alice:
        alice.send_bytes(SYNC_STEP1)
        assert alice.receive_bytes() == EMPTY_SYNC_STEP2


def test_peer_answers_when_one_is_present(client, room):
    with yjs_socket(client, room["id"], "user_alice") as alice:
        with yjs_socket(client, room["id"], "user_bob") as bob:
            bob.send_bytes(SYNC_STEP1)
            # Alice, not the relay, gets to describe the document.
            assert alice.receive_bytes() == SYNC_STEP1

            alice.send_bytes(UPDATE)
            assert bob.receive_bytes() == UPDATE
