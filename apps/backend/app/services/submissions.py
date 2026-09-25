from __future__ import annotations

import asyncpg
from fastapi import HTTPException, status

from app.dao.problems import ProblemDAO
from app.dao.room_members import RoomMemberDAO
from app.dao.rooms import RoomDAO
from app.dao.submissions import SubmissionDAO
from app.dao.users import UserDAO
from app.services.rooms import ensure_room_member, get_active_room

# The runner executes with the Python interpreter it ships with. Other
# languages need their own image and are a later ticket.
SUPPORTED_LANGUAGES = {"python"}

# The runner is one process judging one run at a time. A pair practising
# hard stays well under this; a script holding the runner does not.
RUNS_PER_HOUR = 120
# An analysis costs the runner several seconds, a run well under one.
ANALYSES_PER_HOUR = 20


class SubmissionService:
    def __init__(
        self,
        submission_dao: SubmissionDAO,
        room_dao: RoomDAO,
        room_member_dao: RoomMemberDAO,
        problem_dao: ProblemDAO,
        user_dao: UserDAO,
    ) -> None:
        self.submission_dao = submission_dao
        self.room_dao = room_dao
        self.room_member_dao = room_member_dao
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
        # Runs land in the room's history for everyone in it, so only people
        # in the room get to add to it.
        if not await self.room_member_dao.is_present(room_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Join the room to run code in it",
            )
        if await self.submission_dao.count_created_since(user_id, 3600) >= RUNS_PER_HOUR:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many runs this hour. Try again later.",
            )

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

    async def get_submission(self, submission_id, caller_id: str) -> dict:
        submission = await self.submission_dao.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Submission not found: {submission_id}",
            )
        room = await get_active_room(self.room_dao, submission["roomId"])
        await ensure_room_member(self.room_member_dao, room, caller_id)
        return submission

    async def request_analysis(self, submission_id, caller_id: str) -> dict:
        submission = await self.submission_dao.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Submission not found: {submission_id}",
            )
        room_id = submission["roomId"]
        await get_active_room(self.room_dao, room_id)
        if not await self.room_member_dao.is_present(room_id, caller_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Join the room to analyze runs in it",
            )
        # A wrong answer's timings describe a program that does not solve
        # the problem, so they say nothing useful.
        if submission["status"] != "accepted":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only accepted runs can be analyzed",
            )
        problem = await self.problem_dao.get_by_id(submission["problemId"])
        if not problem or not problem["analyzable"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This problem does not support complexity analysis yet",
            )
        # One analysis per run, whatever it found. Both people in a room can
        # press the button, and the second press sees the first one's. A
        # failed one is final too: the hourly limit counts runs, so retries of
        # one run would never reach it, and the same program on the same
        # inputs would fail the same way.
        if submission["analysisStatus"] is not None:
            return submission
        if await self.submission_dao.count_analyses_since(caller_id, 3600) >= ANALYSES_PER_HOUR:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many analyses this hour. Try again later.",
            )
        try:
            queued = await self.submission_dao.request_analysis(submission_id, caller_id)
        except asyncpg.UniqueViolationError as exc:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Wait for your current analysis to finish",
            ) from exc
        # None means someone else queued it between the read and the update.
        return queued or await self.submission_dao.get_by_id(submission_id)

    async def list_submissions(self, room_id: str, caller_id: str, user_id: str | None = None) -> list[dict]:
        room = await get_active_room(self.room_dao, room_id)
        await ensure_room_member(self.room_member_dao, room, caller_id)
        if user_id:
            return await self.submission_dao.list_by_room_and_user(room_id, user_id)
        return await self.submission_dao.list_by_room(room_id)
