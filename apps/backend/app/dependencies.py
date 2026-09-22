from __future__ import annotations

import asyncpg
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.auth import TokenError, clerk_user_id
from app.dao.problems import ProblemDAO
from app.dao.room_members import RoomMemberDAO
from app.dao.rooms import RoomDAO
from app.dao.submissions import SubmissionDAO
from app.dao.users import UserDAO
from app.services.problems import ProblemService
from app.services.rooms import RoomService
from app.services.submissions import SubmissionService
from app.services.users import UserService


# auto_error=False so a missing header lands on our own 401 below rather than
# FastAPI's bare 403.
_bearer = HTTPBearer(auto_error=False)


async def current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """The Clerk user id behind this request."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return await clerk_user_id(credentials.credentials)
    except TokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


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
