from __future__ import annotations

import asyncpg


class RoomUpdateDAO:
    """Every editor change a room's relay forwarded, in arrival order."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def record(self, room_id: str, data: bytes) -> None:
        # A socket that outlived its room must not append to a finished replay.
        query = """
            INSERT INTO room_updates (room_id, data)
            SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM rooms WHERE id = $1 AND is_active)
        """
        async with self.pool.acquire() as conn:
            await conn.execute(query, room_id, data)

    async def list_for_room(self, room_id: str) -> list[dict]:
        query = "SELECT ts, data FROM room_updates WHERE room_id = $1 ORDER BY id ASC"
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id)
        return [{"ts": row["ts"], "data": row["data"]} for row in rows]
