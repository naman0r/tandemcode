from __future__ import annotations

from fastapi import HTTPException, status

from app.dao.problems import ProblemDAO
from app.dao.rooms import RoomDAO
from app.dao.submissions import SubmissionDAO
from app.dao.users import UserDAO
from app.services.rooms import ensure_room_access


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
        await ensure_room_access(self.room_dao, room_id, user_id)

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

        return await self.submission_dao.create(room_id, user_id, problem_id, language, code)

    async def get_submission(self, submission_id, caller_id: str) -> dict:
        submission = await self.submission_dao.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Submission not found: {submission_id}",
            )
        await ensure_room_access(self.room_dao, submission["roomId"], caller_id)
        return submission

    async def list_submissions(
        self,
        room_id: str,
        caller_id: str,
        user_id: str | None = None,
    ) -> list[dict]:
        await ensure_room_access(self.room_dao, room_id, caller_id)
        if user_id:
            return await self.submission_dao.list_by_room_and_user(room_id, user_id)
        return await self.submission_dao.list_by_room(room_id)
