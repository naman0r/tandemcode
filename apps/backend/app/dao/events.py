from __future__ import annotations

import json

import asyncpg

CHAT_HISTORY_LIMIT = 100


class EventDAO:
    """What happened in a room, in order. Chat now; runs and edits later."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def record(self, room_id: str, event_type: str, payload: dict, max_per_room: int) -> bool:
        """Store an event unless the room already holds `max_per_room` of that type."""
        query = """
            INSERT INTO events (room_id, type, payload_json)
            SELECT $1, $2, $3::jsonb
            WHERE (SELECT COUNT(*) FROM events WHERE room_id = $1 AND type = $2) < $4
        """
        async with self.pool.acquire() as conn:
            tag = await conn.execute(query, room_id, event_type, json.dumps(payload, default=str), max_per_room)
        return tag == "INSERT 0 1"

    async def recent_chat(self, room_id: str, limit: int = CHAT_HISTORY_LIMIT) -> list[dict]:
        """The last `limit` chat messages, oldest first."""
        query = """
            SELECT payload_json FROM (
                SELECT id, payload_json FROM events
                WHERE room_id = $1 AND type = 'chat'
                ORDER BY id DESC
                LIMIT $2
            ) latest
            ORDER BY id ASC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id, limit)
        return [json.loads(row["payload_json"]) for row in rows]

    async def list_for_room(self, room_id: str) -> list[dict]:
        query = "SELECT ts, type, payload_json FROM events WHERE room_id = $1 ORDER BY id ASC"
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id)
        return [
            {"ts": row["ts"], "type": row["type"], "payload": json.loads(row["payload_json"])}
            for row in rows
        ]
