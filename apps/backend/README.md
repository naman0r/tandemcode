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
```

## Run

```bash
# 1. Credentials, then Postgres via Docker
cp .env.example .env      # set DB_PASSWORD
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

Copy the template and set a password — this is required before anything runs:

```bash
cp .env.example .env
# then fill in DB_PASSWORD
```

`.env` is gitignored and holds the real values. `docker-compose.yml` reads the
same variables, so one file configures both the database container and the app.
Real environment variables win over the file, which is how deployments override
it. There is deliberately no fallback for `DB_PASSWORD`; a default would be how
a credential ends up committed.

| Variable | Default | Notes |
| --- | --- | --- |
| `DB_HOST` | `localhost` | `db` when running in Compose |
| `DB_PORT` | `5433` | host port, chosen to avoid clashing with other local Postgres |
| `DB_NAME` | `tandemcode_dev` | |
| `DB_USER` | `tandemcode` | |
| `DB_PASSWORD` | **required** | no default, must be set in `.env` |
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
