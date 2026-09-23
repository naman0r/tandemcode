from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.submissions import SubmissionResponse


class CreateRoomRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=500)


class SetProblemRequest(BaseModel):
    problemId: UUID


class LeaveRoomResponse(BaseModel):
    roomClosed: bool


class RoomResponse(BaseModel):
    id: str
    name: str
    description: str | None
    createdBy: str
    createdByName: str | None
    isActive: bool
    createdAt: datetime
    currentProblemId: UUID | None = None


class UserInRoomResponse(BaseModel):
    userId: str
    name: str | None
    role: str
    joinedAt: datetime


class RecordedUpdate(BaseModel):
    ts: datetime
    data: str


class RecordedEvent(BaseModel):
    ts: datetime
    type: str
    payload: dict


class ReplayResponse(BaseModel):
    room: RoomResponse
    updates: list[RecordedUpdate]
    events: list[RecordedEvent]
    submissions: list[SubmissionResponse]
