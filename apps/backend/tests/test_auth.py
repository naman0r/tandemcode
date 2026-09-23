"""Nobody gets in without a token, and nobody gets to say who they are."""

from __future__ import annotations

import pytest
from starlette.websockets import WebSocketDisconnect

from tests.rig import ORIGIN, auth, token


def test_api_requires_a_token(client):
    assert client.get("/api/rooms").status_code == 401


def test_health_stays_open(client):
    assert client.get("/health").status_code == 200


@pytest.mark.parametrize(
    "bad_token",
    [
        "not.a.token",
        token(ttl=-60),
        token(azp="http://evil.example"),
        token(azp=None),
        token(sub=None),
    ],
    ids=["malformed", "expired", "wrong-origin", "no-azp", "no-subject"],
)
def test_bad_tokens_are_refused(client, bad_token):
    response = client.get("/api/rooms", headers={"Authorization": f"Bearer {bad_token}"})
    assert response.status_code == 401


def test_unsigned_token_is_refused(client):
    import jwt

    from tests.rig import ISSUER

    forged = jwt.encode(
        {"sub": "user_alice", "iss": ISSUER, "azp": ORIGIN, "iat": 0, "exp": 9999999999},
        None,
        algorithm="none",
    )
    assert client.get("/api/rooms", headers={"Authorization": f"Bearer {forged}"}).status_code == 401


def test_profile_comes_from_clerk_not_the_client(client):
    """The body cannot name an id or claim someone else's email."""
    response = client.post(
        "/api/users",
        json={"id": "user_victim", "email": "victim@example.com", "name": "Victim"},
        headers=auth("user_alice"),
    )
    assert response.status_code == 200
    assert response.json()["id"] == "user_alice"
    assert response.json()["email"] == "alice@example.com"


def test_room_is_owned_by_the_caller_not_the_body(client, signed_up):
    signed_up("user_alice")
    response = client.post(
        "/api/rooms",
        json={"name": "r", "description": None, "createdBy": "user_victim"},
        headers=auth("user_alice"),
    )
    assert response.json()["createdBy"] == "user_alice"
    assert response.json()["createdByName"] == "Alice"


def test_submission_is_attributed_to_the_caller_not_the_body(client, room):
    problem_id = client.get("/api/problems", headers=auth("user_alice")).json()[0]["id"]
    response = client.post(
        "/api/submissions",
        json={
            "roomId": room["id"],
            "userId": "user_victim",
            "problemId": problem_id,
            "language": "python",
            "code": "print(1)",
        },
        headers=auth("user_alice"),
    )
    assert response.json()["userId"] == "user_alice"


@pytest.mark.parametrize("path", ["/ws/room/{room_id}", "/ws/yjs/{room_id}"])
@pytest.mark.parametrize(
    "query",
    ["", "?token=not.a.token", "?token={wrong_origin}"],
    ids=["no-token", "bad-token", "wrong-origin"],
)
def test_websocket_handshakes_are_refused(client, room, path, query):
    url = path.format(room_id=room["id"]) + query.format(
        wrong_origin=token(azp="http://evil.example")
    )
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(url):
            pass


def test_websocket_refused_for_unknown_room(client, signed_up):
    signed_up("user_alice")
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/ws/room/does-not-exist?token={token()}"):
            pass


def test_websocket_refused_before_the_user_is_synced(client, room):
    """Presence has a foreign key to users; an unsynced caller must not connect."""
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(
            f"/ws/room/{room['id']}?token={token('user_nobody')}"
        ):
            pass
