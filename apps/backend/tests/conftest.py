"""Fixtures for the API tests.

Needs the development Postgres from docker-compose to be up. Everything runs
against a `tandemcode_test` database dropped and recreated per session, so the
development data is never touched.
"""

from __future__ import annotations

import asyncio

import asyncpg
import pytest

from tests.rig import TEST_DB, auth  # noqa: F401  (imported for its env setup)

from app.core import config  # noqa: E402

async def _reset_database() -> None:
    conn = await asyncpg.connect(
        host=config.DB_HOST,
        port=int(config.DB_PORT),
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database="postgres",
    )
    try:
        await conn.execute(f'DROP DATABASE IF EXISTS "{TEST_DB}" WITH (FORCE)')
        await conn.execute(f'CREATE DATABASE "{TEST_DB}" OWNER "{config.DB_USER}"')
    finally:
        await conn.close()


@pytest.fixture(scope="session", autouse=True)
def database():
    asyncio.run(_reset_database())


@pytest.fixture(autouse=True)
def clerk_profiles(monkeypatch):
    """Stand in for Clerk's user API.

    Profiles are derived from the id so that a test never has to state an email,
    which is the point: the client cannot influence it either.
    """

    async def fetch_profile(user_id: str) -> tuple[str, str]:
        handle = user_id.removeprefix("user_")
        return f"{handle}@example.com", handle.title()

    monkeypatch.setattr("app.services.users.fetch_profile", fetch_profile)


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def signed_up(client):
    """Register users and hand back a helper for their auth headers."""

    def register(*user_ids: str) -> None:
        for user_id in user_ids:
            response = client.post("/api/users", headers=auth(user_id))
            assert response.status_code == 200, response.text

    return register


@pytest.fixture
def room(client, signed_up):
    signed_up("user_alice", "user_bob")
    response = client.post(
        "/api/rooms",
        json={"name": "Test room", "description": "d"},
        headers=auth("user_alice"),
    )
    assert response.status_code == 200, response.text
    return response.json()
