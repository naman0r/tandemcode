# 0003. The server relays the editor

Status: accepted, 2026-09-23

## Context

Two people edit the same code. Yjs merges concurrent edits in each browser, and it only needs a way to pass messages between them.

## Decision

The editor websocket (`app/websocket/yjs.py`) forwards Yjs messages between the people in a room and does not hold the document. It checks each message's framing and rate before forwarding it, answers for an empty document when someone is alone, and records document changes so a room can be replayed.

## Consequences

- The server keeps no per-room document in memory and needs no Yjs implementation of its own.
- The live document exists only in the browsers in the room.
- The server cannot check what a change does to the document, only that the message is well formed and within its limits.
- Anything that needs the current code on the server, such as running it without the browser sending it, would need the server to hold the document.
