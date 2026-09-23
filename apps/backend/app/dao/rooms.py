from __future__ import annotations

from uuid import UUID

import asyncpg


# Joined to users so the room can say who made it by name, not by Clerk id.
SELECT_ROOM = """
    SELECT r.id, r.name, r.description, r.created_by, r.is_active, r.created_at,
           r.current_problem_id, u.name AS created_by_name
    FROM rooms r
    JOIN users u ON u.id = r.created_by
"""


def _map_room(row: asyncpg.Record) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "createdBy": row["created_by"],
        "createdByName": row["created_by_name"],
        "isActive": row["is_active"],
        "createdAt": row["created_at"],
        "currentProblemId": row["current_problem_id"],
    }


class RoomDAO:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def create(self, room_id: str, name: str, description: str | None, created_by: str) -> dict:
        query = "INSERT INTO rooms (id, name, description, created_by) VALUES ($1, $2, $3, $4)"
        async with self.pool.acquire() as conn:
            await conn.execute(query, room_id, name, description, created_by)
        return await self.get_by_id(room_id)

    async def get_by_id(self, room_id: str) -> dict | None:
        query = f"{SELECT_ROOM} WHERE r.id = $1"
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, room_id)
        return _map_room(row) if row else None

    async def list_active(self, limit: int) -> list[dict]:
        """Open rooms with someone in them.

        A room only closes when its owner walks out of it empty, so one whose
        owner closed the tab stays open. Nobody can pair in an empty room, so
        it is left out of the list rather than crowding it.
        """
        query = f"""
            {SELECT_ROOM}
            WHERE r.is_active = TRUE AND EXISTS (
                SELECT 1 FROM room_members rm WHERE rm.room_id = r.id AND rm.left_at IS NULL
            )
            ORDER BY r.created_at DESC
            LIMIT $1
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, limit)
        return [_map_room(row) for row in rows]

    async def list_active_by_creator(self, user_id: str) -> list[dict]:
        query = f"{SELECT_ROOM} WHERE r.created_by = $1 AND r.is_active = TRUE ORDER BY r.created_at DESC"
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, user_id)
        return [_map_room(row) for row in rows]

    async def list_for_participant(self, user_id: str, active: bool) -> list[dict]:
        """Rooms the user created or was ever in, open or closed."""
        query = f"""
            {SELECT_ROOM}
            WHERE r.is_active = $2 AND (
                r.created_by = $1
                OR EXISTS (SELECT 1 FROM room_members rm WHERE rm.room_id = r.id AND rm.user_id = $1)
            )
            ORDER BY r.created_at DESC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, user_id, active)
        return [_map_room(row) for row in rows]

    async def count_created_since(self, user_id: str, seconds: int) -> int:
        query = """
            SELECT COUNT(*) FROM rooms
            WHERE created_by = $1 AND created_at > NOW() - make_interval(secs => $2)
        """
        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, user_id, seconds)

    async def exists(self, room_id: str) -> bool:
        query = "SELECT EXISTS(SELECT 1 FROM rooms WHERE id = $1)"
        async with self.pool.acquire() as conn:
            return bool(await conn.fetchval(query, room_id))

    async def set_current_problem(self, room_id: str, problem_id: UUID) -> dict | None:
        query = "UPDATE rooms SET current_problem_id = $2 WHERE id = $1"
        async with self.pool.acquire() as conn:
            tag = await conn.execute(query, room_id, problem_id)
        if tag == "UPDATE 0":
            return None
        return await self.get_by_id(room_id)
