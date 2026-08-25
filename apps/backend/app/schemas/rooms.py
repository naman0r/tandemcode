from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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
    isActive: bool
    createdAt: datetime
    currentProblemId: UUID | None = None


class UserInRoomResponse(BaseModel):
    userId: str
    name: str | None
    email: str
    role: str
    joinedAt: datetime
