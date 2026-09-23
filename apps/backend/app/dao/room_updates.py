from __future__ import annotations

import asyncpg


class RoomUpdateDAO:
    """Every editor change a room's relay forwarded, in arrival order."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def record(self, room_id: str, data: bytes, max_room_bytes: int) -> bool:
        """Store a frame unless the room is closed or its replay is full.

        A socket that outlived its room must not append to a finished replay,
        and no room may grow its replay past `max_room_bytes`.
        """
        query = """
            WITH room AS (
                UPDATE rooms SET recorded_bytes = recorded_bytes + octet_length($2::bytea)
                WHERE id = $1 AND is_active AND recorded_bytes + octet_length($2::bytea) <= $3
                RETURNING id
            )
            INSERT INTO room_updates (room_id, data) SELECT id, $2::bytea FROM room
        """
        async with self.pool.acquire() as conn:
            return await conn.execute(query, room_id, data, max_room_bytes) == "INSERT 0 1"

    async def list_for_room(self, room_id: str) -> list[dict]:
        query = "SELECT ts, data FROM room_updates WHERE room_id = $1 ORDER BY id ASC"
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id)
        return [{"ts": row["ts"], "data": row["data"]} for row in rows]
