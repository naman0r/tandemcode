from __future__ import annotations

import asyncpg
from fastapi import Request

from app.dao.problems import ProblemDAO
from app.dao.room_members import RoomMemberDAO
from app.dao.rooms import RoomDAO
from app.dao.submissions import SubmissionDAO
from app.dao.users import UserDAO
from app.services.problems import ProblemService
from app.services.rooms import RoomService
from app.services.submissions import SubmissionService
from app.services.users import UserService


def get_pool(request: Request) -> asyncpg.Pool:
    return request.app.state.db_pool


def get_user_service(request: Request) -> UserService:
    return UserService(UserDAO(get_pool(request)))


def get_problem_service(request: Request) -> ProblemService:
    return ProblemService(ProblemDAO(get_pool(request)))


def get_room_service(request: Request) -> RoomService:
    pool = get_pool(request)
    return RoomService(
        room_dao=RoomDAO(pool),
        room_member_dao=RoomMemberDAO(pool),
        problem_dao=ProblemDAO(pool),
        user_dao=UserDAO(pool),
    )


def get_submission_service(request: Request) -> SubmissionService:
    pool = get_pool(request)
    return SubmissionService(
        submission_dao=SubmissionDAO(pool),
        room_dao=RoomDAO(pool),
        problem_dao=ProblemDAO(pool),
        user_dao=UserDAO(pool),
    )
