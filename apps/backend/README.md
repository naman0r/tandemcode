# TandemCode Backend (FastAPI)

The HTTP + WebSocket API for TandemCode. Replaces the Spring Boot service that
used to live in `apps/api`, keeping the same paths so the React client is
unchanged:

- `http://localhost:8080/api/*`
- `ws://localhost:8080/ws/room/{roomId}` — chat and presence
- `ws://localhost:8080/ws/yjs/{roomId}` — Yjs CRDT relay for the shared editor

## Layout

```
app/
  main.py          FastAPI app, lifespan, both websocket endpoints
  core/config.py   settings from environment / .env
  database.py      asyncpg connection pool
  dependencies.py  request-scoped service wiring
  migrate.py       SQL migration runner (replaces Flyway)
  routes/          HTTP endpoints
  services/        business rules and validation
  dao/             SQL queries
  schemas/         Pydantic request/response models
  websocket/       room chat + Yjs relay managers
migrations/        V<n>__<name>.sql, applied in order
tests/             pytest suite
```

## Run

```bash
# 1. Postgres (and optionally the backend itself) via Docker
docker compose up -d db

# 2. Dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Serve on port 8080
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

The whole stack in containers instead: `docker compose up --build`.

## Configuration

Settings come from the environment, falling back to `.env` in this directory,
falling back to defaults that match `docker-compose.yml`. Copy `.env.example` to
`.env` to change them. Real environment variables always win over the file.

| Variable | Default | Notes |
| --- | --- | --- |
| `DB_HOST` | `localhost` | `db` when running in Compose |
| `DB_PORT` | `5433` | host port, chosen to avoid clashing with other local Postgres |
| `DB_NAME` | `tandemcode_dev` | |
| `DB_USER` / `DB_PASSWORD` | `tandemcode` | |
| `CORS_ORIGINS` | `http://localhost:5173` | comma-separated |
| `RUN_MIGRATIONS_ON_STARTUP` | `true` | matches the old Flyway-on-boot behaviour |

## Migrations

SQL files in `migrations/` are named `V<n>__<description>.sql` and applied in
numeric order, exactly once each. Applied versions are recorded in the
`schema_version` table.

```bash
python -m app.migrate     # apply anything pending
```

This also runs automatically at startup unless you set
`RUN_MIGRATIONS_ON_STARTUP=false`. Concurrent runners are serialised with a
Postgres advisory lock, so several instances can boot at once safely.

**Existing databases:** if the database still has Flyway's
`flyway_schema_history` table from the Spring app, the runner adopts those
version numbers on first run so already-applied migrations are not repeated.
That matters because `V2` (`ALTER TABLE ... ADD COLUMN`) and `V3` (seed with a
`UNIQUE` slug) would both fail if run twice.

To add a migration, drop a new `V4__something.sql` in `migrations/`. Forward
only — there are no down migrations.

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

The suite drives the real `app.main:app` with a stubbed connection pool, so
routing, serialisation and websocket lifecycle are all covered without a
database.
