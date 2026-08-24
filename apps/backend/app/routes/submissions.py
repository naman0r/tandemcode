from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_submission_service
from app.schemas.submissions import SubmissionResponse, SubmitRequest
from app.services.submissions import SubmissionService

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionResponse)
async def submit_code(
    payload: SubmitRequest,
    service: SubmissionService = Depends(get_submission_service),
) -> SubmissionResponse:
    submission = await service.submit(
        room_id=payload.roomId,
        user_id=payload.userId,
        problem_id=payload.problemId,
        language=payload.language,
        code=payload.code,
    )
    return SubmissionResponse.model_validate(submission)


@router.get("/room/{room_id}", response_model=list[SubmissionResponse])
async def list_submissions(
    room_id: str,
    userId: str | None = Query(default=None),
    service: SubmissionService = Depends(get_submission_service),
) -> list[SubmissionResponse]:
    submissions = await service.list_submissions(room_id, userId)
    return [SubmissionResponse.model_validate(submission) for submission in submissions]


@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: UUID,
    service: SubmissionService = Depends(get_submission_service),
) -> SubmissionResponse:
    submission = await service.get_submission(submission_id)
    return SubmissionResponse.model_validate(submission)
