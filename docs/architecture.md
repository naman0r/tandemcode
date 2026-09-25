# Architecture

TandemCode has five parts:

- The web app (`apps/web`), a React single-page app built with Vite. In production it is static files on Vercel.
- The API (`apps/backend/app`), a FastAPI process that serves HTTP under `/api` and two websockets under `/ws`.
- The runner (`apps/backend/app/runner`), a separate process from the same image that judges submissions.
- Postgres, which holds everything: users, rooms, chat, editor history, problems and submissions.
- Clerk, which signs people in. TandemCode stores no passwords.

In production Caddy sits in front of the API and terminates TLS. See [self-hosting](self-hosting.md).

## Signing in

The browser signs in with Clerk and gets a short-lived session token. It sends that token as a bearer header on HTTP calls, and as a `token` query parameter when it opens a websocket, because browsers cannot set headers on websockets.

The API verifies the token at the edge and nowhere else: `app/core/auth.py` checks the signature against Clerk's keys, the issuer and the origin that requested it. Routes and websocket handlers turn it into a user id, and everything past that point works with the id. A user's name and email come from Clerk's API (`app/core/clerk.py`), never from the browser.

## A request

HTTP requests go from `app/routes/` to `app/services/` to `app/dao/`. Routes parse input and authenticate. Services hold the rules: who may read a room, who may change its problem, how many rooms or runs a user may start per hour. DAOs hold all the SQL, written by hand for asyncpg. Rate limits that must hold under parallel requests are enforced inside a transaction in the DAO, not by counting first and inserting later.

## A room

A room has two websockets, and the web app opens one of each:

- `/ws/room/{id}` (`app/websocket/room_chat.py`) carries presence, chat, submission updates and problem changes as JSON. Joining it is what puts you on the room's roster. The server stamps every chat message with the sender's identity and time; the client sends only text.
- `/ws/yjs/{id}` (`app/websocket/yjs.py`) carries the shared editor. The document is a [Yjs](https://yjs.dev) CRDT, and the server does not hold a copy. It relays each frame from one peer to the others and answers for an empty document when someone is alone. It checks each frame's framing and rate before relaying it, and it records document changes in `room_updates` for the replay.

Sends to many sockets go through `app/websocket/fanout.py`, which sends to each in parallel with a deadline, so one peer that stops reading cannot hold up the room. Per-user socket caps, frame budgets and chat limits are constants at the top of `room_chat.py` and `yjs.py`.

Rooms are public or unlisted, and the owner can ask for a partner, which highlights the room on the rooms page. Reading a room's runs, roster or replay requires having been in it.

## A run

1. `POST /api/submissions` stores the code as a pending submission and tells the room that a run started.
2. The runner (`app/runner/__main__.py`) claims the oldest pending submission, judges it (see [judge and sandbox](judge-and-sandbox.md)), and stores the verdict.
3. Storing a verdict sends a Postgres `NOTIFY`. The API listens for it (`app/websocket/verdicts.py`) and broadcasts the verdict to the room.

Complexity analysis of an accepted run (`POST /api/submissions/{id}/analysis`) goes through the same queue and the same notification, and the runner takes it only when no submission is waiting. See [judge and sandbox](judge-and-sandbox.md).

The runner polls for work and handles one submission at a time. A submission left running by a runner that died is put back in the queue when a runner starts.

## Replay

When a room closes, its history stays. `GET /api/rooms/{id}/replay` returns the recorded editor changes, the chat and the runs, and the web app (`apps/web/src/routes/rooms/Replay.tsx`) plays them back. Each room has a recording budget (`MAX_RECORDED_BYTES_PER_ROOM` in `yjs.py`), after which it keeps relaying but stops recording.

## Data

The schema is the SQL in `apps/backend/migrations/`, applied in order by `app/migrate.py` when the API starts. Problems are rows too. Each one is added by a migration, which is why contributing a problem is a pull request.

## Where to change what

- A page or component: `apps/web/src/routes/`, `apps/web/src/components/`.
- The API client and websocket URLs: `apps/web/src/lib/api.ts`, `apps/web/src/lib/config.ts`.
- An endpoint's rules: `apps/backend/app/services/`.
- A query: `apps/backend/app/dao/`.
- Realtime behaviour: `apps/backend/app/websocket/`.
- Judging: `apps/backend/app/runner/`.
- Production: `infra/`.
