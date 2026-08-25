from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies import current_user_id, get_problem_service
from app.schemas.problems import CreateProblemRequest, ProblemResponse
from app.services.problems import ProblemService

# Declared on the router so a route added later cannot quietly skip it.
router = APIRouter(
    prefix="/api/problems",
    tags=["problems"],
    dependencies=[Depends(current_user_id)],
)


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


@router.post("", response_model=ProblemResponse)
async def create_problem(
    payload: CreateProblemRequest,
    service: ProblemService = Depends(get_problem_service),
) -> ProblemResponse:
    problem = await service.create_problem(
        slug=payload.slug,
        title=payload.title,
        difficulty=payload.difficulty,
        time_limit_ms=payload.timeLimitMs,
        mem_limit_mb=payload.memLimitMb,
    )
    return ProblemResponse.model_validate(problem)
