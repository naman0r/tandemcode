from __future__ import annotations

from uuid import uuid4

from fastapi import HTTPException, status

from app.dao.problems import ProblemDAO
from app.dao.room_members import RoomMemberDAO
from app.dao.rooms import RoomDAO
from app.dao.users import UserDAO


async def ensure_room_access(room_dao: RoomDAO, room_id: str, user_id: str) -> dict:
    """Return the room if `user_id` may act inside it, otherwise raise.

    Every room-scoped read, write and websocket goes through here, so the rule
    lives in exactly one place.

    That rule is wide on purpose: any signed-in user may enter any active room.
    It is what the product already does - the room list is public and rooms are
    entered by id - and `room_members` records who is connected right now, not
    who is permitted. Narrowing this to invitations needs a real membership
    table first, which is the open question on issue #15. `user_id` is part of
    the signature so that callers must hold an authenticated caller to ask.
    """
    room = await room_dao.get_by_id(room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room not found: {room_id}",
        )
    if not room["isActive"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Room is closed: {room_id}",
        )
    return room


async def ensure_room_owner(room_dao: RoomDAO, room_id: str, user_id: str) -> dict:
    """Return the room if `user_id` created it, otherwise raise.

    Ownership is `rooms.created_by` and nothing else. The `role` column on
    room_members is not consulted, so the two cannot disagree.
    """
    room = await ensure_room_access(room_dao, room_id, user_id)
    if room["createdBy"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the room owner can do that",
        )
    return room


class RoomService:
    def __init__(
        self,
        room_dao: RoomDAO,
        room_member_dao: RoomMemberDAO,
        problem_dao: ProblemDAO,
        user_dao: UserDAO,
    ) -> None:
        self.room_dao = room_dao
        self.room_member_dao = room_member_dao
        self.problem_dao = problem_dao
        self.user_dao = user_dao

    async def create_room(self, name: str, description: str | None, created_by: str) -> dict:
        # The caller is authenticated but may not have been synced into our
        # users table yet, and the room's foreign key needs that row. Checked up
        # front so it is a 404 rather than a foreign key violation as a 500.
        if not await self.user_dao.exists(created_by):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found: {created_by}",
            )

        room_id = str(uuid4())
        return await self.room_dao.create(room_id, name, description, created_by)

    async def get_room(self, room_id: str, caller_id: str) -> dict:
        return await ensure_room_access(self.room_dao, room_id, caller_id)

    async def list_active_rooms(self) -> list[dict]:
        return await self.room_dao.list_active()

    async def list_rooms_by_creator(self, user_id: str) -> list[dict]:
        return await self.room_dao.list_active_by_creator(user_id)

    async def list_room_members(self, room_id: str, caller_id: str) -> list[dict]:
        await ensure_room_access(self.room_dao, room_id, caller_id)
        return await self.room_member_dao.list_members(room_id)

    async def set_current_problem(self, room_id: str, problem_id, caller_id: str) -> dict:
        await ensure_room_owner(self.room_dao, room_id, caller_id)

        if not await self.problem_dao.exists(problem_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Problem not found: {problem_id}",
            )

        updated_room = await self.room_dao.set_current_problem(room_id, problem_id)
        if not updated_room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Room not found: {room_id}",
            )
        return updated_room

    async def leave_room(self, room_id: str, user_id: str) -> dict:
        """Drop the caller's presence, and close the room if that empties it.

        Closing is `is_active = false`, not a DELETE. Submissions and events
        reference the room and are the raw material for the session history we
        want to show people later, so the row has to survive.

        Only an explicit leave can close a room. Disconnecting does not, or a
        refresh or a flaky network would destroy a room out from under someone.
        """
        await ensure_room_access(self.room_dao, room_id, user_id)
        await self.room_member_dao.remove_member(room_id, user_id)

        if await self.room_member_dao.list_members(room_id):
            return {"roomClosed": False}

        await self.room_dao.deactivate(room_id)
        return {"roomClosed": True}
