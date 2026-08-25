from __future__ import annotations

from fastapi import APIRouter, Depends

from app.dependencies import current_user_id, get_room_service
from app.schemas.rooms import (
    CreateRoomRequest,
    RoomResponse,
    SetProblemRequest,
    UserInRoomResponse,
)
from app.services.rooms import RoomService

# Declared on the router so a route added later cannot quietly skip it.
router = APIRouter(
    prefix="/api/rooms",
    tags=["rooms"],
    dependencies=[Depends(current_user_id)],
)


@router.post("", response_model=RoomResponse)
async def create_room(
    payload: CreateRoomRequest,
    user_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> RoomResponse:
    room = await service.create_room(payload.name, payload.description, user_id)
    return RoomResponse.model_validate(room)


@router.get("", response_model=list[RoomResponse])
async def list_active_rooms(
    service: RoomService = Depends(get_room_service),
) -> list[RoomResponse]:
    rooms = await service.list_active_rooms()
    return [RoomResponse.model_validate(room) for room in rooms]


@router.get("/user/{user_id}", response_model=list[RoomResponse])
async def list_rooms_by_creator(
    user_id: str,
    service: RoomService = Depends(get_room_service),
) -> list[RoomResponse]:
    rooms = await service.list_rooms_by_creator(user_id)
    return [RoomResponse.model_validate(room) for room in rooms]


@router.get("/{room_id}/members", response_model=list[UserInRoomResponse])
async def list_room_members(
    room_id: str,
    caller_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> list[UserInRoomResponse]:
    members = await service.list_room_members(room_id, caller_id)
    return [UserInRoomResponse.model_validate(member) for member in members]


@router.patch("/{room_id}/problem", response_model=RoomResponse)
async def set_current_problem(
    room_id: str,
    payload: SetProblemRequest,
    caller_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> RoomResponse:
    room = await service.set_current_problem(room_id, payload.problemId, caller_id)
    return RoomResponse.model_validate(room)


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    caller_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> RoomResponse:
    room = await service.get_room(room_id, caller_id)
    return RoomResponse.model_validate(room)
