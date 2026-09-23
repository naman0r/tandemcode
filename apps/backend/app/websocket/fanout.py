"""Sending one frame to many sockets without letting one of them hold the rest.

A send only returns once the frame is written, and a peer that stops reading
while keeping its connection open never lets that happen. Sent one after
another, one such peer would stall every broadcast in its room. Here the sends
run side by side, each with a deadline; a socket that misses it is marked
stalled, skipped from then on, and closed.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
from collections.abc import Awaitable, Callable, Iterable

from fastapi import WebSocket, status

logger = logging.getLogger(__name__)

# A healthy peer takes a frame in milliseconds; this only has to outlast a
# slow network, not a peer that has stopped reading.
SEND_TIMEOUT_SECONDS = 5.0


async def fan_out(
    sockets: Iterable[WebSocket],
    send: Callable[[WebSocket], Awaitable[None]],
    stalled: set[WebSocket],
) -> None:
    """Send to every socket not already in `stalled`, adding the ones that fail.

    The owner removes a socket from `stalled` when it forgets the socket.
    """

    async def one(websocket: WebSocket) -> None:
        try:
            await asyncio.wait_for(send(websocket), SEND_TIMEOUT_SECONDS)
        except Exception:
            if websocket in stalled:
                return
            stalled.add(websocket)
            logger.warning("Dropping a socket that did not take a frame")
            with contextlib.suppress(Exception):
                await asyncio.wait_for(
                    websocket.close(code=status.WS_1011_INTERNAL_ERROR), SEND_TIMEOUT_SECONDS
                )

    await asyncio.gather(*(one(websocket) for websocket in sockets if websocket not in stalled))
