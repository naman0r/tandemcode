"""Test fixtures.

The suite exercises the real ``app.main:app`` rather than a hand-built copy, so
route wiring, schema serialisation and websocket lifecycle are all covered. The
database is the only thing stubbed out.
"""

from __future__ import annotations

import dataclasses
from typing import Any

import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import app


class FakeConnection:
    """Records every statement so tests can assert on database side effects."""

    def __init__(self, calls: list[tuple[str, tuple[Any, ...]]]) -> None:
        self.calls = calls

    async def execute(self, query: str, *args: Any) -> str:
        self.calls.append((" ".join(query.split()), args))
        return "OK"

    async def fetch(self, query: str, *args: Any) -> list[Any]:
        self.calls.append((" ".join(query.split()), args))
        return []

    async def fetchrow(self, query: str, *args: Any) -> None:
        self.calls.append((" ".join(query.split()), args))
        return None

    async def fetchval(self, query: str, *args: Any) -> None:
        self.calls.append((" ".join(query.split()), args))
        return None


class _Acquire:
    def __init__(self, calls: list[tuple[str, tuple[Any, ...]]]) -> None:
        self.calls = calls

    async def __aenter__(self) -> FakeConnection:
        return FakeConnection(self.calls)

    async def __aexit__(self, *exc_info: object) -> None:
        return None


class FakePool:
    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[Any, ...]]] = []

    def acquire(self) -> _Acquire:
        return _Acquire(self.calls)

    async def close(self) -> None:
        return None

    def statements(self) -> list[str]:
        return [query for query, _ in self.calls]


@pytest.fixture
def pool() -> FakePool:
    return FakePool()


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch, pool: FakePool):
    """TestClient running the real lifespan against a stub pool and no migrations."""

    async def fake_create_pool() -> FakePool:
        return pool

    monkeypatch.setattr(main_module, "create_pool", fake_create_pool)
    monkeypatch.setattr(
        main_module,
        "settings",
        dataclasses.replace(main_module.settings, run_migrations_on_startup=False),
    )

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
