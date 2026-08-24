from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class CreateProblemRequest(BaseModel):
    slug: str
    title: str
    difficulty: str
    timeLimitMs: int = Field(default=2000)
    memLimitMb: int = Field(default=256)


class ProblemResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    difficulty: str | None
    timeLimitMs: int
    memLimitMb: int
