from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.dependencies import current_user_id, get_user_service
from app.schemas.users import UserResponse
from app.services.users import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def sync_user(
    user_id: str = Depends(current_user_id),
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    return UserResponse.model_validate(await service.sync_user(user_id))


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    user = await service.get_user(user_id)
    return UserResponse.model_validate(user)


@router.get("", response_model=list[UserResponse])
async def list_users(
    service: UserService = Depends(get_user_service),
) -> list[UserResponse]:
    users = await service.list_users()
    return [UserResponse.model_validate(user) for user in users]
