from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.dependencies import current_user_id, get_user_service
from app.schemas.users import CreateUserRequest, UserResponse
from app.services.users import UserService

# Declared on the router so a route added later cannot quietly skip it.
router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Depends(current_user_id)],
)


@router.post("", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def create_user(
    payload: CreateUserRequest,
    user_id: str = Depends(current_user_id),
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    # The id is the token's, never the body's. Email and name stay client-supplied
    # because Clerk's default session token does not carry them.
    user = await service.create_user(user_id, payload.email, payload.name)
    return UserResponse.model_validate(user)


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
