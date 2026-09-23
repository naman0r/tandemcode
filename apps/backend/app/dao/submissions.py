from __future__ import annotations

import json
from uuid import UUID

import asyncpg

# Joined to users so a run can be shown as "Alice, accepted" to the whole room.
SELECT_SUBMISSION = """
    SELECT s.id, s.room_id, s.user_id, s.problem_id, s.language, s.code, s.status,
           s.time_ms, s.created_at, s.s3_key_stdout, s.s3_key_stderr,
           s.s3_key_result_json, s.result, u.name AS user_name
    FROM submissions s
    JOIN users u ON u.id = s.user_id
"""

# Runners raise this after writing a verdict; the API listens and tells the room.
JUDGED_CHANNEL = "submission_judged"


def _map_submission(row: asyncpg.Record) -> dict:
    return {
        "id": row["id"],
        "roomId": row["room_id"],
        "userId": row["user_id"],
        "userName": row["user_name"],
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
        query = """
            INSERT INTO submissions (room_id, user_id, problem_id, language, code, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING id
        """
        async with self.pool.acquire() as conn:
            submission_id = await conn.fetchval(query, room_id, user_id, problem_id, language, code)
        return await self.get_by_id(submission_id)

    async def get_by_id(self, submission_id: UUID) -> dict | None:
        query = f"{SELECT_SUBMISSION} WHERE s.id = $1"
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, submission_id)
        return _map_submission(row) if row else None

    async def list_by_room(self, room_id: str) -> list[dict]:
        query = f"{SELECT_SUBMISSION} WHERE s.room_id = $1 ORDER BY s.created_at DESC"
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id)
        return [_map_submission(row) for row in rows]

    async def list_by_room_and_user(self, room_id: str, user_id: str) -> list[dict]:
        query = f"{SELECT_SUBMISSION} WHERE s.room_id = $1 AND s.user_id = $2 ORDER BY s.created_at DESC"
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id, user_id)
        return [_map_submission(row) for row in rows]

    async def claim_pending(self) -> dict | None:
        """Move the oldest pending submission to running and return it."""
        query = """
            UPDATE submissions SET status = 'running'
            WHERE id = (
                SELECT id FROM submissions
                WHERE status = 'pending'
                ORDER BY created_at
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING id
        """
        async with self.pool.acquire() as conn:
            submission_id = await conn.fetchval(query)
        return await self.get_by_id(submission_id) if submission_id else None

    async def complete(self, submission_id: UUID, status: str, time_ms: int, result: dict) -> None:
        query = "UPDATE submissions SET status = $2, time_ms = $3, result = $4::jsonb WHERE id = $1"
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(query, submission_id, status, time_ms, json.dumps(result))
                # Inside the transaction so the notification cannot outrun the row.
                await conn.execute("SELECT pg_notify($1, $2)", JUDGED_CHANNEL, str(submission_id))

    async def requeue_running(self) -> int:
        async with self.pool.acquire() as conn:
            tag = await conn.execute("UPDATE submissions SET status = 'pending' WHERE status = 'running'")
        return int(tag.rsplit(" ", 1)[1])
