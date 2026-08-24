from __future__ import annotations

from uuid import UUID

import asyncpg


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
            RETURNING
                id,
                room_id,
                user_id,
                problem_id,
                language,
                code,
                status,
                time_ms,
                created_at,
                s3_key_stdout,
                s3_key_stderr,
                s3_key_result_json
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, room_id, user_id, problem_id, language, code)
        return _map_submission(row)

    async def get_by_id(self, submission_id: UUID) -> dict | None:
        query = """
            SELECT
                id,
                room_id,
                user_id,
                problem_id,
                language,
                code,
                status,
                time_ms,
                created_at,
                s3_key_stdout,
                s3_key_stderr,
                s3_key_result_json
            FROM submissions
            WHERE id = $1
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, submission_id)
        return _map_submission(row) if row else None

    async def list_by_room(self, room_id: str) -> list[dict]:
        query = """
            SELECT
                id,
                room_id,
                user_id,
                problem_id,
                language,
                code,
                status,
                time_ms,
                created_at,
                s3_key_stdout,
                s3_key_stderr,
                s3_key_result_json
            FROM submissions
            WHERE room_id = $1
            ORDER BY created_at DESC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id)
        return [_map_submission(row) for row in rows]

    async def list_by_room_and_user(self, room_id: str, user_id: str) -> list[dict]:
        query = """
            SELECT
                id,
                room_id,
                user_id,
                problem_id,
                language,
                code,
                status,
                time_ms,
                created_at,
                s3_key_stdout,
                s3_key_stderr,
                s3_key_result_json
            FROM submissions
            WHERE room_id = $1 AND user_id = $2
            ORDER BY created_at DESC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id, user_id)
        return [_map_submission(row) for row in rows]
