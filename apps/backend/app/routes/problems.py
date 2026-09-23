from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_problem_service
from app.schemas.problems import ProblemResponse
from app.services.problems import ProblemService

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("", response_model=list[ProblemResponse])
async def list_problems(
    difficulty: str | None = Query(default=None),
    service: ProblemService = Depends(get_problem_service),
) -> list[ProblemResponse]:
    problems = await service.list_problems(difficulty)
    return [ProblemResponse.model_validate(problem) for problem in problems]


@router.get("/slug/{slug}", response_model=ProblemResponse)
async def get_problem_by_slug(
    slug: str,
    service: ProblemService = Depends(get_problem_service),
) -> ProblemResponse:
    problem = await service.get_problem_by_slug(slug)
    return ProblemResponse.model_validate(problem)


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: UUID,
    service: ProblemService = Depends(get_problem_service),
) -> ProblemResponse:
    problem = await service.get_problem(problem_id)
    return ProblemResponse.model_validate(problem)
