from __future__ import annotations

import asyncpg


def _map_user(row: asyncpg.Record) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "createdAt": row["created_at"],
    }


class UserDAO:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def create(self, user_id: str, email: str, name: str) -> dict:
        query = """
            INSERT INTO users (id, email, name)
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE
            SET email = EXCLUDED.email, name = EXCLUDED.name
            RETURNING id, email, name, created_at
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id, email, name)
        return _map_user(row)

    async def get_by_id(self, user_id: str) -> dict | None:
        query = """
            SELECT id, email, name, created_at
            FROM users
            WHERE id = $1
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)
        return _map_user(row) if row else None

    async def list_all(self) -> list[dict]:
        query = """
            SELECT id, email, name, created_at
            FROM users
            ORDER BY created_at ASC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query)
        return [_map_user(row) for row in rows]
