from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CreateUserRequest(BaseModel):
    email: str
    name: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    createdAt: datetime
