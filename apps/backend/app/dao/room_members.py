from __future__ import annotations

import asyncpg


def _map_user_in_room(row: asyncpg.Record) -> dict:
    return {
        "userId": row["user_id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "joinedAt": row["joined_at"],
    }


class RoomMemberDAO:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def add_member(self, room_id: str, user_id: str, role: str = "participant") -> None:
        query = """
            INSERT INTO room_members (room_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (room_id, user_id) DO NOTHING
        """
        async with self.pool.acquire() as conn:
            await conn.execute(query, room_id, user_id, role)

    async def remove_member(self, room_id: str, user_id: str) -> None:
        query = """
            DELETE FROM room_members
            WHERE room_id = $1 AND user_id = $2
        """
        async with self.pool.acquire() as conn:
            await conn.execute(query, room_id, user_id)

    async def list_members(self, room_id: str) -> list[dict]:
        query = """
            SELECT rm.user_id, u.name, u.email, rm.role, rm.joined_at
            FROM room_members rm
            JOIN users u ON u.id = rm.user_id
            WHERE rm.room_id = $1
            ORDER BY rm.joined_at ASC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id)
        return [_map_user_in_room(row) for row in rows]
