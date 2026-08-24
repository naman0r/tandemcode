from __future__ import annotations

import asyncpg
from fastapi import HTTPException, status

from app.dao.users import UserDAO


class UserService:
    def __init__(self, user_dao: UserDAO) -> None:
        self.user_dao = user_dao

    async def create_user(self, user_id: str, email: str, name: str) -> dict:
        # A repeat id is an upsert, but email carries its own UNIQUE constraint,
        # so a second account claiming a taken email is a conflict, not a crash.
        try:
            return await self.user_dao.create(user_id, email, name)
        except asyncpg.UniqueViolationError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email already registered: {email}",
            ) from exc

    async def get_user(self, user_id: str) -> dict:
        user = await self.user_dao.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found with id: {user_id}",
            )
        return user

    async def list_users(self) -> list[dict]:
        return await self.user_dao.list_all()
