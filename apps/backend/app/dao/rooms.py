from __future__ import annotations

from uuid import UUID

import asyncpg


# Joined to users so the room can say who made it by name, not by Clerk id.
# A room asking for a partner has one once two people are in it, and is
# asking again if one of them leaves, so advertised is read off the roster.
SELECT_ROOM = """
    SELECT r.id, r.name, r.description, r.created_by, r.is_active, r.created_at,
           r.current_problem_id, r.visibility, u.name AS created_by_name,
           m.member_count, r.advertised AND m.member_count < 2 AS advertised
    FROM rooms r
    JOIN users u ON u.id = r.created_by
    CROSS JOIN LATERAL (
        SELECT COUNT(*) AS member_count FROM room_members rm
        WHERE rm.room_id = r.id AND rm.left_at IS NULL
    ) m
"""


# First key of the per-creator advisory lock taken while creating a room.
ROOM_LIMIT_LOCK = 1


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
        "visibility": row["visibility"],
        "advertised": row["advertised"],
        "memberCount": row["member_count"],
    }


class RoomDAO:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def create(
        self,
        room_id: str,
        name: str,
        description: str | None,
        created_by: str,
        visibility: str,
        advertised: bool,
        per_hour: int,
        per_day: int,
    ) -> dict | None:
        """Create the room, or return None if its creator is over a limit.

        The count and the insert share a transaction holding a lock on the
        creator, so requests sent together cannot all pass the count.
        """
        count = """
            SELECT COUNT(*) FROM rooms
            WHERE created_by = $1 AND created_at > NOW() - make_interval(secs => $2)
        """
        insert = """
            INSERT INTO rooms (id, name, description, created_by, visibility, advertised)
            VALUES ($1, $2, $3, $4, $5, $6)
        """
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute("SELECT pg_advisory_xact_lock($1, hashtext($2))", ROOM_LIMIT_LOCK, created_by)
                if (
                    await conn.fetchval(count, created_by, 3600) >= per_hour
                    or await conn.fetchval(count, created_by, 86400) >= per_day
                ):
                    return None
                await conn.execute(insert, room_id, name, description, created_by, visibility, advertised)
        return await self.get_by_id(room_id)

    async def get_by_id(self, room_id: str) -> dict | None:
        query = f"{SELECT_ROOM} WHERE r.id = $1"
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, room_id)
        return _map_room(row) if row else None

    async def list_listed(self, limit: int) -> list[dict]:
        """Open public rooms with someone in them, rooms asking for a partner first.

        A room only closes when its owner walks out of it empty, so one whose
        owner closed the tab stays open. Nobody can pair in an empty room, so
        it is left out of the list rather than crowding it.
        """
        query = f"""
            {SELECT_ROOM}
            WHERE r.is_active = TRUE AND r.visibility = 'public' AND m.member_count > 0
            ORDER BY r.advertised AND m.member_count < 2 DESC, r.created_at DESC
            LIMIT $1
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, limit)
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

    async def exists(self, room_id: str) -> bool:
        query = "SELECT EXISTS(SELECT 1 FROM rooms WHERE id = $1)"
        async with self.pool.acquire() as conn:
            return bool(await conn.fetchval(query, room_id))

    async def set_listing(self, room_id: str, visibility: str, advertised: bool) -> dict:
        query = "UPDATE rooms SET visibility = $2, advertised = $3 WHERE id = $1"
        async with self.pool.acquire() as conn:
            await conn.execute(query, room_id, visibility, advertised)
        return await self.get_by_id(room_id)

    async def set_current_problem(self, room_id: str, problem_id: UUID) -> dict | None:
        query = "UPDATE rooms SET current_problem_id = $2 WHERE id = $1"
        async with self.pool.acquire() as conn:
            tag = await conn.execute(query, room_id, problem_id)
        if tag == "UPDATE 0":
            return None
        return await self.get_by_id(room_id)
