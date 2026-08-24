from __future__ import annotations

from uuid import UUID

import asyncpg


def _map_room(row: asyncpg.Record) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "createdBy": row["created_by"],
        "isActive": row["is_active"],
        "createdAt": row["created_at"],
        "currentProblemId": row["current_problem_id"],
    }


class RoomDAO:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def create(self, room_id: str, name: str, description: str | None, created_by: str) -> dict:
        query = """
            INSERT INTO rooms (id, name, description, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, description, created_by, is_active, created_at, current_problem_id
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, room_id, name, description, created_by)
        return _map_room(row)

    async def get_by_id(self, room_id: str) -> dict | None:
        query = """
            SELECT id, name, description, created_by, is_active, created_at, current_problem_id
            FROM rooms
            WHERE id = $1
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, room_id)
        return _map_room(row) if row else None

    async def list_active(self) -> list[dict]:
        query = """
            SELECT id, name, description, created_by, is_active, created_at, current_problem_id
            FROM rooms
            WHERE is_active = TRUE
            ORDER BY created_at DESC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query)
        return [_map_room(row) for row in rows]

    async def list_active_by_creator(self, user_id: str) -> list[dict]:
        query = """
            SELECT id, name, description, created_by, is_active, created_at, current_problem_id
            FROM rooms
            WHERE created_by = $1 AND is_active = TRUE
            ORDER BY created_at DESC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, user_id)
        return [_map_room(row) for row in rows]

    async def exists(self, room_id: str) -> bool:
        query = "SELECT EXISTS(SELECT 1 FROM rooms WHERE id = $1)"
        async with self.pool.acquire() as conn:
            return bool(await conn.fetchval(query, room_id))

    async def set_current_problem(self, room_id: str, problem_id: UUID) -> dict | None:
        query = """
            UPDATE rooms
            SET current_problem_id = $2
            WHERE id = $1
            RETURNING id, name, description, created_by, is_active, created_at, current_problem_id
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, room_id, problem_id)
        return _map_room(row) if row else None
