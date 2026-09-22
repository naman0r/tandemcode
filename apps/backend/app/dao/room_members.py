from __future__ import annotations

from typing import NamedTuple

import asyncpg


def _map_user_in_room(row: asyncpg.Record) -> dict:
    return {
        "userId": row["user_id"],
        "name": row["name"],
        "role": row["role"],
        "joinedAt": row["joined_at"],
    }


class MembershipRemoval(NamedTuple):
    removed: bool
    closed: bool


class RoomMemberDAO:
    """Who is currently in a room.

    A room is closed when it empties, so occupancy and room lifecycle are the
    same question. Both transitions below therefore lock the room row: without
    it a join landing next to a leave can leave a closed room with a member in
    it, or an open room with nobody.
    """

    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def add_member(self, room_id: str, user_id: str) -> bool:
        """Record presence. False if the room closed before we got here."""
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                is_active = await conn.fetchval(
                    "SELECT is_active FROM rooms WHERE id = $1 FOR UPDATE", room_id
                )
                if not is_active:
                    return False

                await conn.execute(
                    """
                    INSERT INTO room_members (room_id, user_id)
                    VALUES ($1, $2)
                    ON CONFLICT (room_id, user_id) DO NOTHING
                    """,
                    room_id,
                    user_id,
                )
                return True

    async def remove_member(
        self, room_id: str, user_id: str, close_if_empty: bool = False
    ) -> MembershipRemoval:
        """Drop presence, and close the room when that was the last presence.

        `close_if_empty` is the difference between walking out of a room and
        losing your connection to it: only an explicit leave should be able to
        close a room, or a refresh would destroy it.
        """
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.fetchval(
                    "SELECT id FROM rooms WHERE id = $1 FOR UPDATE", room_id
                )
                removed = await conn.fetchval(
                    "DELETE FROM room_members WHERE room_id = $1 AND user_id = $2 RETURNING user_id",
                    room_id,
                    user_id,
                )
                if not removed:
                    return MembershipRemoval(False, False)

                if not close_if_empty:
                    return MembershipRemoval(True, False)

                remaining = await conn.fetchval(
                    "SELECT COUNT(*) FROM room_members WHERE room_id = $1", room_id
                )
                if remaining:
                    return MembershipRemoval(True, False)

                await conn.execute(
                    "UPDATE rooms SET is_active = FALSE WHERE id = $1", room_id
                )
                return MembershipRemoval(True, True)

    async def list_members(self, room_id: str) -> list[dict]:
        query = """
            SELECT rm.user_id, u.name, rm.joined_at,
                   CASE WHEN r.created_by = rm.user_id THEN 'owner' ELSE 'participant' END AS role
            FROM room_members rm
            JOIN users u ON u.id = rm.user_id
            JOIN rooms r ON r.id = rm.room_id
            WHERE rm.room_id = $1
            ORDER BY rm.joined_at ASC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, room_id)
        return [_map_user_in_room(row) for row in rows]
