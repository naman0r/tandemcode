"""Websocket behaviour, including parity with the retired Spring handlers."""

from __future__ import annotations

from app.main import app


def test_chat_broadcasts_to_every_session_including_sender(client):
    """RoomSocketHandler broadcast to all sessions in the room; keep that."""
    with client.websocket_connect("/ws/room/room1") as first:
        with client.websocket_connect("/ws/room/room1") as second:
            first.send_text("hello room")
            assert first.receive_text() == "hello room"
            assert second.receive_text() == "hello room"


def test_chat_does_not_leak_across_rooms(client):
    with client.websocket_connect("/ws/room/room1") as first:
        with client.websocket_connect("/ws/room/room2") as other_room:
            first.send_text("only for room1")
            assert first.receive_text() == "only for room1"
            other_room.send_text("only for room2")
            assert other_room.receive_text() == "only for room2"


def test_chat_persists_and_removes_presence_when_user_id_is_given(client, pool):
    with client.websocket_connect("/ws/room/room1?userId=user_42"):
        pass

    inserts = [q for q in pool.statements() if q.startswith("INSERT INTO room_members")]
    deletes = [q for q in pool.statements() if q.startswith("DELETE FROM room_members")]
    assert inserts, "expected the member to be recorded on connect"
    assert deletes, "expected the member to be removed on disconnect"
    assert ("room1", "user_42", "participant") == next(
        args for q, args in pool.calls if q.startswith("INSERT INTO room_members")
    )


def test_chat_without_user_id_touches_no_presence_rows(client, pool):
    with client.websocket_connect("/ws/room/room1") as ws:
        ws.send_text("anonymous")
        assert ws.receive_text() == "anonymous"

    assert not [q for q in pool.statements() if "room_members" in q]


def test_yjs_relays_binary_to_peers_but_not_the_sender(client):
    with client.websocket_connect("/ws/yjs/room1") as first:
        with client.websocket_connect("/ws/yjs/room1") as second:
            first.send_bytes(b"\x00\x01update")
            assert second.receive_bytes() == b"\x00\x01update"

            # The sender must not receive its own update echoed back; prove it by
            # sending from the peer and seeing that arrive instead.
            second.send_bytes(b"\x02peer")
            assert first.receive_bytes() == b"\x02peer"


def test_yjs_relays_text_frames(client):
    with client.websocket_connect("/ws/yjs/room1") as first:
        with client.websocket_connect("/ws/yjs/room1") as second:
            first.send_text("sync-step-1")
            assert second.receive_text() == "sync-step-1"


def test_yjs_disconnect_does_not_raise(client):
    """Regression: receive() returns the disconnect frame instead of raising.

    Before the fix the loop called receive() again after the disconnect message
    and blew up with RuntimeError('Cannot call "receive" once a disconnect
    message has been received.'), logging a traceback on every editor close.
    Exiting the context manager below is what triggers it.
    """
    with client.websocket_connect("/ws/yjs/room-close") as ws:
        ws.send_bytes(b"\x01payload")

    assert "room-close" not in app.state.yjs_relay_manager.room_sessions


def test_disconnect_cleans_up_room_state(client):
    with client.websocket_connect("/ws/room/ephemeral") as ws:
        ws.send_text("hi")
        ws.receive_text()
        assert "ephemeral" in app.state.room_chat_manager.room_sessions

    assert "ephemeral" not in app.state.room_chat_manager.room_sessions
