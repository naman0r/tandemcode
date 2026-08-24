# what am i doing bro

## Current shape (Aug 2026)

```
apps/web       React + Vite + Monaco, Clerk auth, Yjs for the shared editor
     │  HTTP  :8080/api/*          WS  :8080/ws/room/{id}, :8080/ws/yjs/{id}
     ▼
apps/backend   FastAPI (Python 3.11)
               routes/ → services/ → dao/   (asyncpg, raw SQL)
               websocket/  room chat + presence, Yjs binary relay
               migrate.py  V<n>__*.sql applied in order
     ▼
Postgres 13    docker compose, host port 5433
```

- The backend is stateless apart from in-process websocket session maps, so
  rooms are pinned to a single instance for now. Scaling out needs a shared
  pub/sub (Redis) behind the room and Yjs managers.
- Yjs is a dumb relay: clients own CRDT merging, the server keeps no document
  state.
- Code execution (SQS → Fargate judge) is not built yet; submissions are stored
  with `status = 'pending'` and never advance.
