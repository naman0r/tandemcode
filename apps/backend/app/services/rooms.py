from __future__ import annotations

from uuid import uuid4

from fastapi import HTTPException, status

from app.dao.problems import ProblemDAO
from app.dao.room_members import RoomMemberDAO
from app.dao.rooms import RoomDAO
from app.dao.users import UserDAO


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
        # Checked up front so an unknown creator is a 404 rather than a foreign
        # key violation surfacing as a 500.
        if not await self.user_dao.exists(created_by):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found: {created_by}",
            )

        room_id = str(uuid4())
        return await self.room_dao.create(room_id, name, description, created_by)

    async def get_room(self, room_id: str) -> dict:
        room = await self.room_dao.get_by_id(room_id)
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Room not found with id: {room_id}",
            )
        return room

    async def list_active_rooms(self) -> list[dict]:
        return await self.room_dao.list_active()

    async def list_rooms_by_creator(self, user_id: str) -> list[dict]:
        return await self.room_dao.list_active_by_creator(user_id)

    async def list_room_members(self, room_id: str) -> list[dict]:
        return await self.room_member_dao.list_members(room_id)

    async def set_current_problem(self, room_id: str, problem_id) -> dict:
        room = await self.room_dao.get_by_id(room_id)
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Room not found: {room_id}",
            )

        problem_exists = await self.problem_dao.exists(problem_id)
        if not problem_exists:
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
