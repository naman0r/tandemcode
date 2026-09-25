from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# Generous for a solution, far too small to be a storage or judge problem.
MAX_CODE_BYTES = 64 * 1024


class SubmitRequest(BaseModel):
    roomId: str = Field(max_length=64)
    problemId: UUID
    language: str = Field(max_length=32)
    code: str = Field(max_length=MAX_CODE_BYTES)


class TestOutcome(BaseModel):
    index: int
    hidden: bool
    passed: bool
    timeMs: int
    stdout: str
    stderr: str


class SubmissionResult(BaseModel):
    status: str
    timeMs: int
    passed: int
    total: int
    tests: list[TestOutcome]


class ComplexityPoint(BaseModel):
    n: int
    ms: float


class ComplexityAnalysis(BaseModel):
    points: list[ComplexityPoint]
    complexity: str | None
    slope: float | None
    note: str | None


class SubmissionResponse(BaseModel):
    id: UUID
    roomId: str
    userId: str
    userName: str | None
    problemId: UUID
    language: str
    code: str | None
    status: str | None
    timeMs: int | None
    createdAt: datetime
    s3KeyStdout: str | None = None
    s3KeyStderr: str | None = None
    s3KeyResultJson: str | None = None
    result: SubmissionResult | None = None
    analysisStatus: str | None = None
    analysis: ComplexityAnalysis | None = None
