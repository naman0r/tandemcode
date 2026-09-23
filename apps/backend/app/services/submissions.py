from __future__ import annotations

import asyncpg
from fastapi import HTTPException, status

from app.dao.problems import ProblemDAO
from app.dao.rooms import RoomDAO
from app.dao.submissions import SubmissionDAO
from app.dao.users import UserDAO
from app.services.rooms import get_active_room

# The runner executes with the Python interpreter it ships with. Other
# languages need their own image and are a later ticket.
SUPPORTED_LANGUAGES = {"python"}


class SubmissionService:
    def __init__(
        self,
        submission_dao: SubmissionDAO,
        room_dao: RoomDAO,
        problem_dao: ProblemDAO,
        user_dao: UserDAO,
    ) -> None:
        self.submission_dao = submission_dao
        self.room_dao = room_dao
        self.problem_dao = problem_dao
        self.user_dao = user_dao

    async def submit(
        self,
        room_id: str,
        user_id: str,
        problem_id,
        language: str,
        code: str,
    ) -> dict:
        if language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported language: {language}",
            )
        await get_active_room(self.room_dao, room_id)

        problem_exists = await self.problem_dao.exists(problem_id)
        if not problem_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Problem not found: {problem_id}",
            )

        user_exists = await self.user_dao.exists(user_id)
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found: {user_id}",
            )

        # The runner is shared. One run at a time per person keeps a loop of
        # submits from queueing everyone else's verdicts behind it; a unique
        # index enforces it, so two requests at once cannot both get through.
        try:
            return await self.submission_dao.create(room_id, user_id, problem_id, language, code)
        except asyncpg.UniqueViolationError as exc:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Wait for your current run to finish",
            ) from exc

    async def get_submission(self, submission_id) -> dict:
        submission = await self.submission_dao.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Submission not found: {submission_id}",
            )
        await get_active_room(self.room_dao, submission["roomId"])
        return submission

    async def list_submissions(self, room_id: str, user_id: str | None = None) -> list[dict]:
        await get_active_room(self.room_dao, room_id)
        if user_id:
            return await self.submission_dao.list_by_room_and_user(room_id, user_id)
        return await self.submission_dao.list_by_room(room_id)
