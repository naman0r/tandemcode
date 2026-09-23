from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.schemas.submissions import SubmissionResponse


Visibility = Literal["public", "unlisted"]


class RoomListing(BaseModel):
    visibility: Visibility = "public"
    advertised: bool = False

    @model_validator(mode="after")
    def _advertise_only_in_public(self):
        if self.advertised and self.visibility != "public":
            raise ValueError("Only a public room can be advertised")
        return self


class CreateRoomRequest(RoomListing):
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
    visibility: Visibility
    advertised: bool
    memberCount: int


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
