from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.dao.room_members import RoomMemberDAO
from app.database import create_pool
from app.routes.problems import router as problems_router
from app.routes.rooms import router as rooms_router
from app.routes.submissions import router as submissions_router
from app.routes.users import router as users_router
from app.websocket.room_chat import RoomChatManager
from app.websocket.yjs import YjsRelayManager

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_pool = await create_pool()
    app.state.room_chat_manager = RoomChatManager()
    app.state.yjs_relay_manager = YjsRelayManager()
    try:
        yield
    finally:
        await app.state.db_pool.close()


app = FastAPI(title="TandemCode Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(problems_router)
app.include_router(rooms_router)
app.include_router(submissions_router)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws/room/{room_id}")
async def room_websocket(websocket: WebSocket, room_id: str) -> None:
    manager: RoomChatManager = websocket.app.state.room_chat_manager
    pool = websocket.app.state.db_pool
    room_member_dao = RoomMemberDAO(pool)
    user_id = websocket.query_params.get("userId")

    await manager.connect(websocket, room_id)
    await manager.add_member_if_possible(room_member_dao, room_id, user_id)

    try:
        while True:
            message = await websocket.receive_text()
            await manager.broadcast(room_id, message)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, room_id)
        await manager.remove_member_if_possible(room_member_dao, room_id, user_id)


@app.websocket("/ws/yjs/{room_id}")
async def yjs_websocket(websocket: WebSocket, room_id: str) -> None:
    manager: YjsRelayManager = websocket.app.state.yjs_relay_manager
    await manager.connect(websocket, room_id)

    try:
        while True:
            message = await websocket.receive()
            if message.get("bytes") is not None:
                await manager.relay_bytes(room_id, websocket, message["bytes"])
            elif message.get("text") is not None:
                await manager.relay_text(room_id, websocket, message["text"])
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, room_id)
