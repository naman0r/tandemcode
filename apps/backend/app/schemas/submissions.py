from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SubmitRequest(BaseModel):
    roomId: str
    userId: str
    problemId: UUID
    language: str
    code: str


class SubmissionResponse(BaseModel):
    id: UUID
    roomId: str
    userId: str
    problemId: UUID
    language: str
    code: str | None
    status: str | None
    timeMs: int | None
    createdAt: datetime
    s3KeyStdout: str | None = None
    s3KeyStderr: str | None = None
    s3KeyResultJson: str | None = None
