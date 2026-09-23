"""Presence, ownership, chat identity and room closure."""

from __future__ import annotations

import pytest
from starlette.websockets import WebSocketDisconnect

from tests.rig import (
    auth,
    close_socket,
    next_chat,
    room_socket as connect,
    roster,
    wait_for_roster,
)


def test_creator_is_owner_and_others_are_participants(client, room):
    with connect(client, room["id"], "user_alice") as alice:
        assert roster(alice) == [("user_alice", "owner")]

        with connect(client, room["id"], "user_bob") as bob:
            assert roster(bob) == [
                ("user_alice", "owner"),
                ("user_bob", "participant"),
            ]
            # The member already in the room is told, without asking.
            assert roster(alice) == [
                ("user_alice", "owner"),
                ("user_bob", "participant"),
            ]

            close_socket(bob)
            # And is told again when he goes.
            assert roster(alice) == [("user_alice", "owner")]


def test_presence_survives_a_second_tab_closing(client, room):
    with connect(client, room["id"], "user_alice") as first:
        roster(first)
        with connect(client, room["id"], "user_alice") as second:
            roster(second)
            roster(first)

            close_socket(second)
            # One socket of theirs is gone, but the user is not.
            assert roster(first) == [("user_alice", "owner")]


def test_chat_is_attributed_to_the_authenticated_sender(client, room):
    with connect(client, room["id"], "user_alice") as alice:
        roster(alice)
        with connect(client, room["id"], "user_bob") as bob:
            roster(alice)
            roster(bob)

            bob.send_json(
                {
                    "type": "chat",
                    "text": "hello",
                    "userId": "user_alice",
                    "username": "Alice",
                    "timestamp": "1999-01-01T00:00:00Z",
                }
            )

            event = next_chat(alice)

    assert event["userId"] == "user_bob", "sender was taken from the payload"
    assert event["username"] == "Bob"
    assert event["text"] == "hello"
    assert not event["timestamp"].startswith("1999")


@pytest.mark.parametrize(
    "payload",
    [{"type": "chat"}, {"type": "chat", "text": "   "}, {"type": "nonsense", "text": "x"}],
    ids=["no-text", "blank-text", "unknown-type"],
)
def test_junk_frames_are_not_relayed(client, room, payload):
    with connect(client, room["id"], "user_alice") as alice:
        roster(alice)
        with connect(client, room["id"], "user_bob") as bob:
            roster(alice)
            roster(bob)
            bob.send_json(payload)
            bob.send_json({"type": "chat", "text": "real"})

            # The junk frame would have arrived first had it been relayed.
            assert next_chat(alice)["text"] == "real"


def test_only_the_owner_can_set_the_problem(client, room):
    problem_id = client.get("/api/problems", headers=auth("user_alice")).json()[0]["id"]
    url = f"/api/rooms/{room['id']}/problem"

    assert client.patch(url, json={"problemId": problem_id}, headers=auth("user_bob")).status_code == 403
    assert client.patch(url, json={"problemId": problem_id}, headers=auth("user_alice")).status_code == 200


def test_a_non_member_cannot_leave(client, room):
    with connect(client, room["id"], "user_alice") as alice:
        roster(alice)
        response = client.post(f"/api/rooms/{room['id']}/leave", headers=auth("user_bob"))
        assert response.status_code == 403
        assert response.json()["detail"] == "You are not in this room"

    assert client.get(f"/api/rooms/{room['id']}", headers=auth("user_alice")).status_code == 200


def test_leaving_an_empty_room_closes_it_without_losing_data(client, room):
    problem_id = client.get("/api/problems", headers=auth("user_alice")).json()[0]["id"]

    with connect(client, room["id"], "user_alice"):
        client.post(
            "/api/submissions",
            json={
                "roomId": room["id"],
                "problemId": problem_id,
                "language": "python",
                "code": "print(1)",
            },
            headers=auth("user_alice"),
        )
        assert client.post(
            f"/api/rooms/{room['id']}/leave", headers=auth("user_alice")
        ).json() == {"roomClosed": True}

    assert client.get(f"/api/rooms/{room['id']}", headers=auth("user_alice")).status_code == 403
    assert room["id"] not in [r["id"] for r in client.get("/api/rooms", headers=auth("user_alice")).json()]


def test_only_the_owner_leaving_closes_an_empty_room(client, room):
    """Otherwise anyone could close an idle room by joining it and leaving."""
    with connect(client, room["id"], "user_bob"):
        response = client.post(f"/api/rooms/{room['id']}/leave", headers=auth("user_bob"))
        assert response.json() == {"roomClosed": False}

    assert client.get(f"/api/rooms/{room['id']}", headers=auth("user_alice")).status_code == 200


def test_only_occupied_rooms_are_listed(client, room):
    listed = lambda: [r["id"] for r in client.get("/api/rooms", headers=auth("user_bob")).json()]  # noqa: E731
    assert room["id"] not in listed()
    with connect(client, room["id"], "user_alice") as alice:
        roster(alice)
        assert room["id"] in listed()


def test_room_creation_is_rate_limited(client, signed_up, monkeypatch):
    monkeypatch.setattr("app.services.rooms.ROOMS_PER_HOUR", 1)
    signed_up("user_dave")
    create = lambda: client.post("/api/rooms", json={"name": "r"}, headers=auth("user_dave"))  # noqa: E731
    assert create().status_code == 200
    assert create().status_code == 429


def test_a_closed_room_refuses_new_sockets(client, room):
    """The join path checks room state under the same lock that closes it."""
    with connect(client, room["id"], "user_alice"):
        client.post(f"/api/rooms/{room['id']}/leave", headers=auth("user_alice"))

    with pytest.raises(WebSocketDisconnect):
        with connect(client, room["id"], "user_alice"):
            pass


def test_leaving_closes_every_tab_for_that_user(client, room):
    with connect(client, room["id"], "user_alice") as first:
        with connect(client, room["id"], "user_alice") as second:
            roster(first)
            roster(second)

            response = client.post(
                f"/api/rooms/{room['id']}/leave", headers=auth("user_alice")
            )
            assert response.json() == {"roomClosed": True}

    assert client.get(f"/api/rooms/{room['id']}", headers=auth("user_alice")).status_code == 403


def test_disconnecting_never_closes_a_room(client, room):
    """Only an explicit leave closes a room; a refresh must not destroy it."""
    with connect(client, room["id"], "user_alice") as alice:
        roster(alice)
        close_socket(alice)
        wait_for_roster(client, room["id"], [])

    assert client.get(f"/api/rooms/{room['id']}", headers=auth("user_alice")).status_code == 200


def test_chat_history_greets_a_late_arrival(client, room):
    with connect(client, room["id"], "user_alice") as alice:
        roster(alice)
        alice.send_json({"type": "chat", "text": "first"})
        next_chat(alice)
        alice.send_json({"type": "chat", "text": "second"})
        next_chat(alice)

    with connect(client, room["id"], "user_bob") as bob:
        # History first, then the live roster.
        assert [next_chat(bob)["text"], next_chat(bob)["text"]] == ["first", "second"]
        assert ("user_bob", "participant") in roster(bob)


def listed_ids(client) -> list[str]:
    return [r["id"] for r in client.get("/api/rooms", headers=auth("user_bob")).json()]


def test_an_unlisted_room_is_reachable_by_link_but_not_listed(client, signed_up):
    signed_up("user_alice", "user_bob")
    room = client.post(
        "/api/rooms", json={"name": "Quiet", "visibility": "unlisted"}, headers=auth("user_alice")
    ).json()
    with connect(client, room["id"], "user_alice") as alice:
        roster(alice)
        assert room["id"] not in listed_ids(client)
        assert client.get(f"/api/rooms/{room['id']}", headers=auth("user_bob")).status_code == 200


def test_an_unlisted_room_cannot_be_advertised(client, signed_up):
    signed_up("user_alice")
    response = client.post(
        "/api/rooms",
        json={"name": "x", "visibility": "unlisted", "advertised": True},
        headers=auth("user_alice"),
    )
    assert response.status_code == 422


def test_advertised_rooms_come_first_until_a_partner_arrives(client, room, signed_up):
    other = client.post("/api/rooms", json={"name": "Later"}, headers=auth("user_alice")).json()
    url = f"/api/rooms/{room['id']}/listing"
    ask = {"visibility": "public", "advertised": True}
    assert client.put(url, json=ask, headers=auth("user_bob")).status_code == 403
    assert client.put(url, json=ask, headers=auth("user_alice")).status_code == 200

    with connect(client, room["id"], "user_alice") as alice, connect(client, other["id"], "user_alice"):
        roster(alice)
        # Newer rooms normally come first; the advertised one jumps ahead.
        ids = listed_ids(client)
        assert ids.index(room["id"]) < ids.index(other["id"])

        with connect(client, room["id"], "user_bob") as bob:
            roster(alice)
            fetched = client.get(f"/api/rooms/{room['id']}", headers=auth("user_alice")).json()
            assert fetched["advertised"] is False
            assert fetched["memberCount"] == 2
            close_socket(bob)
            roster(alice)

        # Alone again, so asking again.
        assert client.get(f"/api/rooms/{room['id']}", headers=auth("user_alice")).json()["advertised"] is True


def test_the_owner_can_unlist_a_room(client, room):
    url = f"/api/rooms/{room['id']}/listing"
    with connect(client, room["id"], "user_alice") as alice:
        roster(alice)
        assert room["id"] in listed_ids(client)
        client.put(url, json={"visibility": "unlisted", "advertised": False}, headers=auth("user_alice"))
        assert room["id"] not in listed_ids(client)
        # A partial update is refused rather than read as "public".
        assert client.put(url, json={"advertised": False}, headers=auth("user_alice")).status_code == 422


def test_one_user_cannot_open_unlimited_sockets(client, room):
    with connect(client, room["id"], "user_alice"), connect(client, room["id"], "user_alice"):
        with connect(client, room["id"], "user_alice"):
            with pytest.raises(WebSocketDisconnect):
                with connect(client, room["id"], "user_alice"):
                    pass


def test_a_room_stops_taking_chat_at_its_cap(client, room, monkeypatch):
    monkeypatch.setattr("app.websocket.room_chat.MAX_CHAT_MESSAGES_PER_ROOM", 1)
    with connect(client, room["id"], "user_alice") as alice:
        roster(alice)
        alice.send_json({"type": "chat", "text": "first"})
        assert next_chat(alice)["text"] == "first"
        alice.send_json({"type": "chat", "text": "second"})
    events = client.get(f"/api/rooms/{room['id']}/replay", headers=auth("user_alice")).json()["events"]
    assert [e["payload"]["text"] for e in events if e["type"] == "chat"] == ["first"]

