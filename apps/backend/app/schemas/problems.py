from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class SampleTest(BaseModel):
    input: str
    expected: str


class ProblemResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    difficulty: str | None
    timeLimitMs: int
    memLimitMb: int
    statement: str | None
    starterCode: str | None
    samples: list[SampleTest]
    analyzable: bool = False
    expectedComplexity: str | None = None
