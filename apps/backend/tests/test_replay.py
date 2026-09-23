"""A session outlives the room: who was there, what was typed, what was said."""

from __future__ import annotations

import base64

from app.dao.room_updates import RoomUpdateDAO
from tests.rig import auth, next_chat, room_socket, roster
from tests.test_yjs import SYNC_STEP1, UPDATE, yjs_socket


def test_editor_changes_are_recorded_but_sync_requests_are_not(client, room):
    with room_socket(client, room["id"], "user_alice"), yjs_socket(client, room["id"], "user_alice") as alice:
        alice.send_bytes(SYNC_STEP1)
        alice.receive_bytes()
        alice.send_bytes(UPDATE)
        alice.send_bytes(bytes([1, 0]))  # awareness
        # Frames are handled in order, so this reply means the update was stored.
        alice.send_bytes(SYNC_STEP1)
        alice.receive_bytes()

    replay = client.get(f"/api/rooms/{room['id']}/replay", headers=auth("user_alice")).json()
    assert [base64.b64decode(u["data"]) for u in replay["updates"]] == [UPDATE]


def test_a_closed_room_is_replayable_by_those_who_were_there(client, room):
    with room_socket(client, room["id"], "user_alice") as alice:
        roster(alice)
        with room_socket(client, room["id"], "user_bob") as bob:
            roster(alice)
            roster(bob)
            bob.send_json({"type": "chat", "text": "ready?"})
            next_chat(alice)
            client.post(f"/api/rooms/{room['id']}/leave", headers=auth("user_bob"))
        client.post(f"/api/rooms/{room['id']}/leave", headers=auth("user_alice"))

    assert client.get(f"/api/rooms/{room['id']}", headers=auth("user_alice")).status_code == 403

    for user in ("user_alice", "user_bob"):
        response = client.get(f"/api/rooms/{room['id']}/replay", headers=auth(user))
        assert response.status_code == 200, response.text
        replay = response.json()
        assert replay["room"]["isActive"] is False
        assert [e["payload"]["text"] for e in replay["events"] if e["type"] == "chat"] == ["ready?"]

    client.post("/api/users", headers=auth("user_carol"))
    assert client.get(f"/api/rooms/{room['id']}/replay", headers=auth("user_carol")).status_code == 403


def test_a_closed_room_records_nothing_more(client, room):
    """A relay socket that outlived the room cannot rewrite its replay."""
    pool = client.app.state.db_pool
    with room_socket(client, room["id"], "user_alice"):
        client.post(f"/api/rooms/{room['id']}/leave", headers=auth("user_alice"))
    client.portal.call(RoomUpdateDAO(pool).record, room["id"], UPDATE)

    assert client.portal.call(RoomUpdateDAO(pool).list_for_room, room["id"]) == []


def test_past_sessions_list_the_rooms_you_were_in(client, room):
    with room_socket(client, room["id"], "user_alice") as alice:
        roster(alice)
        with room_socket(client, room["id"], "user_bob") as bob:
            roster(bob)
            client.post(f"/api/rooms/{room['id']}/leave", headers=auth("user_bob"))
        roster(alice)

        # Bob has left but Alice is still there, so the room is open.
        open_rooms = client.get("/api/rooms/mine", headers=auth("user_bob")).json()
        assert room["id"] in [r["id"] for r in open_rooms]
        past = client.get("/api/rooms/mine", params={"active": "false"}, headers=auth("user_bob")).json()
        assert room["id"] not in [r["id"] for r in past]

        client.post(f"/api/rooms/{room['id']}/leave", headers=auth("user_alice"))

    # Other tests close rooms too, so membership, not equality, is what to check.
    for user in ("user_alice", "user_bob"):
        past = client.get("/api/rooms/mine", params={"active": "false"}, headers=auth(user)).json()
        assert room["id"] in [r["id"] for r in past]
        assert room["id"] not in [r["id"] for r in client.get("/api/rooms/mine", headers=auth(user)).json()]


def test_rejoining_after_leaving_revives_presence_once(client, room):
    with room_socket(client, room["id"], "user_alice") as alice:
        roster(alice)
        with room_socket(client, room["id"], "user_bob") as first:
            roster(first)
            client.post(f"/api/rooms/{room['id']}/leave", headers=auth("user_bob"))
        roster(alice)
        with room_socket(client, room["id"], "user_bob") as second:
            assert roster(second) == [("user_alice", "owner"), ("user_bob", "participant")]
