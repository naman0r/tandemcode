from __future__ import annotations

import logging

import asyncpg
from fastapi import HTTPException, status

from app.core.clerk import ClerkProfileError, fetch_profile
from app.dao.users import UserDAO

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, user_dao: UserDAO) -> None:
        self.user_dao = user_dao

    async def sync_user(self, user_id: str) -> dict:
        """Mirror Clerk's copy of the caller into our users table."""
        try:
            email, name = await fetch_profile(user_id)
        except ClerkProfileError as exc:
            logger.warning("%s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not read your profile from Clerk",
            ) from exc

        # A repeat id is an upsert. Email carries its own UNIQUE constraint, and
        # while Clerk should never hand two accounts the same address, a crash
        # is the wrong way to find out.
        try:
            return await self.user_dao.create(user_id, email, name)
        except asyncpg.UniqueViolationError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email already registered: {email}",
            ) from exc
