from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.dependencies import current_user_id, get_room_service
from app.dao.room_members import RoomMemberDAO
from app.schemas.rooms import (
    ReplayResponse,
    CreateRoomRequest,
    LeaveRoomResponse,
    RoomListing,
    RoomResponse,
    SetProblemRequest,
    UserInRoomResponse,
)
from app.services.rooms import RoomService

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", response_model=RoomResponse)
async def create_room(
    payload: CreateRoomRequest,
    user_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> RoomResponse:
    room = await service.create_room(
        payload.name, payload.description, user_id, payload.visibility, payload.advertised
    )
    return RoomResponse.model_validate(room)


@router.get("", response_model=list[RoomResponse])
async def list_active_rooms(
    service: RoomService = Depends(get_room_service),
) -> list[RoomResponse]:
    rooms = await service.list_active_rooms()
    return [RoomResponse.model_validate(room) for room in rooms]


@router.get("/mine", response_model=list[RoomResponse])
async def list_my_rooms(
    active: bool = True,
    caller_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> list[RoomResponse]:
    rooms = await service.list_my_rooms(caller_id, active)
    return [RoomResponse.model_validate(room) for room in rooms]


@router.get("/{room_id}/replay", response_model=ReplayResponse)
async def get_replay(
    room_id: str,
    caller_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> ReplayResponse:
    return ReplayResponse.model_validate(await service.get_replay(room_id, caller_id))


@router.get("/{room_id}/members", response_model=list[UserInRoomResponse])
async def list_room_members(
    room_id: str,
    caller_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> list[UserInRoomResponse]:
    members = await service.list_room_members(room_id, caller_id)
    return [UserInRoomResponse.model_validate(member) for member in members]


@router.post("/{room_id}/leave", response_model=LeaveRoomResponse)
async def leave_room(
    room_id: str,
    request: Request,
    caller_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> LeaveRoomResponse:
    result = await service.leave_room(room_id, caller_id)
    await request.app.state.room_chat_manager.close_user(
        room_id, caller_id, RoomMemberDAO(request.app.state.db_pool)
    )
    yjs = request.app.state.yjs_relay_manager
    # An editor socket can outlive its room socket after a dropped connection,
    # so a closing room shuts every one of them, not only the leaver's.
    if result["roomClosed"]:
        await yjs.close_room(room_id)
    else:
        await yjs.close_user(room_id, caller_id)
    return LeaveRoomResponse.model_validate(result)


@router.patch("/{room_id}/problem", response_model=RoomResponse)
async def set_current_problem(
    room_id: str,
    payload: SetProblemRequest,
    request: Request,
    caller_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> RoomResponse:
    room = RoomResponse.model_validate(
        await service.set_current_problem(room_id, payload.problemId, caller_id)
    )
    # The shared editor switches for everyone; the statement beside it must too.
    await request.app.state.room_chat_manager.broadcast(
        room_id, {"type": "problem", "problemId": room.currentProblemId}
    )
    return room


@router.put("/{room_id}/listing", response_model=RoomResponse)
async def set_listing(
    room_id: str,
    payload: RoomListing,
    caller_id: str = Depends(current_user_id),
    service: RoomService = Depends(get_room_service),
) -> RoomResponse:
    room = await service.set_listing(room_id, payload.visibility, payload.advertised, caller_id)
    return RoomResponse.model_validate(room)


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    service: RoomService = Depends(get_room_service),
) -> RoomResponse:
    room = await service.get_room(room_id)
    return RoomResponse.model_validate(room)
