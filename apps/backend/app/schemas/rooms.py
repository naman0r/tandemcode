from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.submissions import SubmissionResponse


class CreateRoomRequest(BaseModel):
    name: str
    description: str | None = None


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
