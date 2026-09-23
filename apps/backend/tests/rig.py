"""A fake Clerk: one signing key, one JWKS endpoint, and tokens it will vouch for.

Separate from conftest so that importing it from a test module gets the same
instance pytest loaded. Two instances would mean two signing keys, and every
token would be rejected - which would make the rejection tests pass for the
wrong reason.
"""

from __future__ import annotations

import json
import os
import threading
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, HTTPServer

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa

TEST_DB = "tandemcode_test"
ORIGIN = "http://localhost:5173"
_KID = "test-kid"

_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(_key.public_key()))
_jwk.update(kid=_KID, use="sig", alg="RS256")
_JWKS = json.dumps({"keys": [_jwk]}).encode()


JWKS_FETCHES = []


class _JwksHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        JWKS_FETCHES.append(time.time())
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(_JWKS)))
        self.end_headers()
        self.wfile.write(_JWKS)

    def log_message(self, *args):
        pass


_jwks_server = HTTPServer(("127.0.0.1", 0), _JwksHandler)
threading.Thread(target=_jwks_server.serve_forever, daemon=True).start()
ISSUER = f"http://127.0.0.1:{_jwks_server.server_address[1]}"

# Set before app.core.config is imported anywhere, since it reads the
# environment exactly once.
os.environ["CLERK_ISSUER"] = ISSUER
os.environ["CLERK_AUTHORIZED_PARTIES"] = ORIGIN
os.environ["CLERK_SECRET_KEY"] = "sk_test_stubbed_in_tests"
os.environ["DB_NAME"] = TEST_DB
os.environ["RUN_MIGRATIONS_ON_STARTUP"] = "true"



def token(sub: str = "user_alice", azp: str = ORIGIN, ttl: int = 300, kid: str = _KID, **claims) -> str:
    """A session token that our fake Clerk will vouch for."""
    now = int(time.time())
    payload = {
        "sub": sub,
        "iss": ISSUER,
        "azp": azp,
        "iat": now,
        "exp": now + ttl,
        "sid": "sess_test",
        **claims,
    }
    return jwt.encode(
        {k: v for k, v in payload.items() if v is not None},
        _key,
        algorithm="RS256",
        headers={"kid": kid},
    )


def auth(sub: str = "user_alice") -> dict[str, str]:
    return {"Authorization": f"Bearer {token(sub)}"}


@contextmanager
def room_socket(client, room_id: str, user_id: str):
    """A room websocket, closed the way a real client closes one."""
    session = client.websocket_connect(f"/ws/room/{room_id}?token={token(user_id)}")
    session.__enter__()
    try:
        yield session
    finally:
        close_socket(session)
        session.__exit__(None, None, None)


def close_socket(session) -> None:
    """Disconnect, and let the server finish unwinding presence.

    TestClient cancels the server task when a session exits, which skips the
    endpoint's `finally` and so never removes the presence row. Closing
    explicitly delivers a disconnect frame the app actually handles - but the
    app only gets to run it while the session is still alive, so a test that
    wants to observe the departure must call this itself and then block on
    something: another socket's next frame, or wait_for_roster below.
    """
    if getattr(session, "_closed_by_test", False):
        return
    session._closed_by_test = True
    session.close()


def roster(socket) -> list[tuple[str, str]]:
    """Wait for the next presence frame and flatten it to (user id, role)."""
    while True:
        event = socket.receive_json()
        if event["type"] == "presence":
            return sorted((m["userId"], m["role"]) for m in event["members"])


def next_chat(socket) -> dict:
    while True:
        event = socket.receive_json()
        if event["type"] == "chat":
            return event


def wait_for_roster(client, room_id: str, expected: list[str], attempts: int = 100) -> None:
    """Poll the roster until it settles. Bounded, so a regression fails rather
    than hanging the suite."""
    for _ in range(attempts):
        response = client.get(f"/api/rooms/{room_id}/members", headers=auth("user_alice"))
        if response.status_code == 200:
            actual = sorted(member["userId"] for member in response.json())
            if actual == sorted(expected):
                return
        time.sleep(0.05)
    raise AssertionError(f"roster for {room_id} never became {sorted(expected)}")
