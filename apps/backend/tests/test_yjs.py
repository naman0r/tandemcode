"""The Yjs relay: forwards between peers, and stands in for one when alone."""

from __future__ import annotations

import pytest
from starlette.websockets import WebSocketDisconnect

from app.websocket.yjs import EMPTY_SYNC_STEP2
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
