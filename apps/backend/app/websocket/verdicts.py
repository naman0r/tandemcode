"""Verdicts reach the room the moment the runner writes them.

The runner is a separate process, so the API cannot see it finish. It raises a
Postgres notification instead, and one dedicated connection here listens for
it and pushes the judged submission to every socket in that room.
"""

from __future__ import annotations

import asyncio
import logging
from uuid import UUID

import asyncpg

from app.core.config import DATABASE_URL
from app.dao.submissions import JUDGED_CHANNEL, SubmissionDAO
from app.websocket.room_chat import RoomChatManager

logger = logging.getLogger(__name__)

RECONNECT_SECONDS = 2.0


class VerdictListener:
    def __init__(self, pool: asyncpg.Pool, chat: RoomChatManager) -> None:
        self.submissions = SubmissionDAO(pool)
        self.chat = chat
        self.conn: asyncpg.Connection | None = None
        self.stopping = False
        self.reconnecting: asyncio.Task | None = None

    async def start(self) -> None:
        # LISTEN ties up a connection for good, which is why it is not one
        # borrowed from the pool.
        self.conn = await asyncpg.connect(dsn=DATABASE_URL)
        await self.conn.add_listener(JUDGED_CHANNEL, self._on_judged)
        self.conn.add_termination_listener(self._on_terminated)

    async def stop(self) -> None:
        self.stopping = True
        if self.reconnecting is not None:
            self.reconnecting.cancel()
        if self.conn is not None:
            await self.conn.close()

    def _on_terminated(self, _conn) -> None:
        # A database restart ends the LISTEN silently, and verdicts would
        # stop reaching rooms until the API restarted. Clients refetch runs
        # when their socket reconnects, so nothing judged meanwhile is lost.
        if not self.stopping:
            self.reconnecting = asyncio.get_running_loop().create_task(self._reconnect())

    async def _reconnect(self) -> None:
        while not self.stopping:
            try:
                await self.start()
                logger.info("Verdict listener reconnected")
                return
            except (OSError, asyncpg.PostgresError) as exc:
                logger.warning("Verdict listener reconnect failed: %s", exc)
                await asyncio.sleep(RECONNECT_SECONDS)

    async def _on_judged(self, _conn, _pid, _channel, payload: str) -> None:
        submission = await self.submissions.get_by_id(UUID(payload))
        if submission is None:
            logger.warning("Judged submission %s not found", payload)
            return
        await self.chat.broadcast(submission["roomId"], {"type": "submission", "submission": submission})
