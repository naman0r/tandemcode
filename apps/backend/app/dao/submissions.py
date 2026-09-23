from __future__ import annotations

import json
from uuid import UUID

import asyncpg

COLUMNS = (
    "id, room_id, user_id, problem_id, language, code, status, time_ms, created_at, "
    "s3_key_stdout, s3_key_stderr, s3_key_result_json, result"
)


def _map_submission(row: asyncpg.Record) -> dict:
    return {
        "id": row["id"],
        "roomId": row["room_id"],
        "userId": row["user_id"],
        "problemId": row["problem_id"],
        "language": row["language"],
        "code": row["code"],
        "status": row["status"],
        "timeMs": row["time_ms"],
        "createdAt": row["created_at"],
        "s3KeyStdout": row["s3_key_stdout"],
        "s3KeyStderr": row["s3_key_stderr"],
        "s3KeyResultJson": row["s3_key_result_json"],
        "result": json.loads(row["result"]) if row["result"] else None,
    }


class SubmissionDAO:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def create(
        self,
        room_id: str,
        user_id: str,
        problem_id: UUID,
        language: str,
        code: str,
    ) -> dict:
        query = f"""
            INSERT INTO submissions (room_id, user_id, problem_id, language, code, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING {COLUMNS}
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, room_id, user_id, problem_id, language, code)
        return _map_submission(row)

    async def get_by_id(self, submission_id: UUID) -> dict | None:
        query = f"""
            SELECT {COLUMNS}
            FROM submissions
            WHERE id = $1
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, submission_id)
        return _map_submission(row) if row else None

    async def list_by_room(self, room_id: str) -> list[dict]:
        query = f"""
            SELECT {COLUMNS}
            FROM submissions
            WHERE room_id = $1
            ORDER BY created_at DESC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id)
        return [_map_submission(row) for row in rows]

    async def list_by_room_and_user(self, room_id: str, user_id: str) -> list[dict]:
        query = f"""
            SELECT {COLUMNS}
            FROM submissions
            WHERE room_id = $1 AND user_id = $2
            ORDER BY created_at DESC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id, user_id)
        return [_map_submission(row) for row in rows]

    async def claim_pending(self) -> dict | None:
        """Move the oldest pending submission to running and return it."""
        query = f"""
            UPDATE submissions SET status = 'running'
            WHERE id = (
                SELECT id FROM submissions
                WHERE status = 'pending'
                ORDER BY created_at
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING {COLUMNS}
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query)
        return _map_submission(row) if row else None

    async def complete(self, submission_id: UUID, status: str, time_ms: int, result: dict) -> None:
        query = "UPDATE submissions SET status = $2, time_ms = $3, result = $4::jsonb WHERE id = $1"
        async with self.pool.acquire() as conn:
            await conn.execute(query, submission_id, status, time_ms, json.dumps(result))

    async def requeue_running(self) -> int:
        async with self.pool.acquire() as conn:
            tag = await conn.execute("UPDATE submissions SET status = 'pending' WHERE status = 'running'")
        return int(tag.rsplit(" ", 1)[1])
