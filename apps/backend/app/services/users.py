from __future__ import annotations

import logging
import time

import asyncpg
from fastapi import HTTPException, status

from app.core.clerk import ClerkProfileError, fetch_profile
from app.dao.users import UserDAO

logger = logging.getLogger(__name__)

# Every sync is a call to Clerk's API with our secret key, and the web app
# syncs on each page load. One a minute per user is plenty and stops one
# account from spending the whole Clerk rate limit.
# ponytail: per process and never pruned; a column would survive restarts.
SYNC_INTERVAL_SECONDS = 60
_last_synced: dict[str, float] = {}


class UserService:
    def __init__(self, user_dao: UserDAO) -> None:
        self.user_dao = user_dao

    async def sync_user(self, user_id: str) -> dict:
        """Mirror Clerk's copy of the caller into our users table."""
        if time.monotonic() - _last_synced.get(user_id, float("-inf")) < SYNC_INTERVAL_SECONDS:
            user = await self.user_dao.get_by_id(user_id)
            if user:
                return user
        # Claimed before the call, so a burst of requests makes one call, not many.
        _last_synced[user_id] = time.monotonic()
        try:
            email, name = await fetch_profile(user_id)
        except ClerkProfileError as exc:
            _last_synced.pop(user_id, None)
            logger.warning("%s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not read your profile from Clerk",
            ) from exc

        # A repeat id is an upsert. Email carries its own UNIQUE constraint, and
        # while Clerk should never hand two accounts the same address, a crash
        # is the wrong way to find out.
        try:
            user = await self.user_dao.create(user_id, email, name)
        except asyncpg.UniqueViolationError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email already registered: {email}",
            ) from exc
        return user
