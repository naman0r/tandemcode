from __future__ import annotations

from uuid import UUID

import asyncpg


def _map_problem(row: asyncpg.Record) -> dict:
    return {
        "id": row["id"],
        "slug": row["slug"],
        "title": row["title"],
        "difficulty": row["difficulty"],
        "timeLimitMs": row["time_limit_ms"],
        "memLimitMb": row["mem_limit_mb"],
    }


class ProblemDAO:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def list_all(self) -> list[dict]:
        query = """
            SELECT id, slug, title, difficulty, time_limit_ms, mem_limit_mb
            FROM problems
            ORDER BY title ASC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query)
        return [_map_problem(row) for row in rows]

    async def list_by_difficulty(self, difficulty: str) -> list[dict]:
        query = """
            SELECT id, slug, title, difficulty, time_limit_ms, mem_limit_mb
            FROM problems
            WHERE difficulty = $1
            ORDER BY title ASC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, difficulty)
        return [_map_problem(row) for row in rows]

    async def get_by_id(self, problem_id: UUID) -> dict | None:
        query = """
            SELECT id, slug, title, difficulty, time_limit_ms, mem_limit_mb
            FROM problems
            WHERE id = $1
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, problem_id)
        return _map_problem(row) if row else None

    async def get_by_slug(self, slug: str) -> dict | None:
        query = """
            SELECT id, slug, title, difficulty, time_limit_ms, mem_limit_mb
            FROM problems
            WHERE slug = $1
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, slug)
        return _map_problem(row) if row else None

    async def exists(self, problem_id: UUID) -> bool:
        query = "SELECT EXISTS(SELECT 1 FROM problems WHERE id = $1)"
        async with self.pool.acquire() as conn:
            return bool(await conn.fetchval(query, problem_id))

    async def create(
        self,
        slug: str,
        title: str,
        difficulty: str,
        time_limit_ms: int,
        mem_limit_mb: int,
    ) -> dict:
        query = """
            INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, slug, title, difficulty, time_limit_ms, mem_limit_mb
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, slug, title, difficulty, time_limit_ms, mem_limit_mb)
        return _map_problem(row)
