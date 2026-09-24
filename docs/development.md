# Development

## What you need

- Docker with Compose v2. Postgres, the API and the runner run in containers, and the runner starts one more container per submission.
- Node 22, the version in `apps/web/.nvmrc` (`nvm use` in `apps/web` picks it up).
- `make`, which macOS and most Linux distributions already have.
- A Clerk application. The free development instance is enough, and in development Clerk supplies the credentials for social sign-in itself.

## First run

```bash
make setup    # copies both .env templates, installs web dependencies
```

Then fill in the two `.env` files it created:

- `apps/backend/.env`: any `DB_PASSWORD`, `CLERK_ISSUER` (the Frontend API URL under API keys in the Clerk dashboard) and `CLERK_SECRET_KEY`.
- `apps/web/.env`: `VITE_CLERK_PUBLISHABLE_KEY` from the same Clerk instance.

```bash
make up       # Postgres, the API and the runner
make web      # the web app, at http://localhost:5173
```

The API applies migrations when it starts, and the runner waits for the API's health check, so the runner never reads a half-migrated schema. On its first start the runner pulls the image it judges submissions in, which takes a minute.

To try a room with two people, sign in with a second Clerk account in a private window or another browser profile.

`make` on its own lists every command. The ports are 5173 for the web app, 8080 for the API and 5433 for Postgres, which listens on loopback only.

## Checks

```bash
make check    # backend tests, web lint, web build
```

This is what CI runs (`.github/workflows/`), plus a check that every relative link in the Markdown files resolves. Backend tests run inside the API image against the compose database, in a `tandemcode_test` database that is dropped and recreated on each run.

## Common changes

### A schema change

Add `apps/backend/migrations/V<next>__<what_it_does>.sql`, numbered after the highest existing file. Migrations only go forward. Never edit one that has been merged, because production has already applied it; write a new one instead. The API applies pending migrations on start (`app/migrate.py`), and the test suite applies all of them to an empty database, so a broken migration fails CI.

### An HTTP endpoint

Requests go from `app/routes/` to `app/services/` to `app/dao/`:

- The route authenticates with `Depends(current_user_id)` from `app/dependencies.py` and passes the caller's id on.
- The service applies the rules, such as who may do what and rate limits. It receives a user id, never a token.
- The DAO holds the SQL. SQL does not appear anywhere else.

### A room event

The server sends events to everyone in a room with `RoomChatManager.broadcast` in `app/websocket/room_chat.py`. The web app handles them in `apps/web/src/hooks/UseWebSocket.ts`. There is one room socket per room: `RoomView` opens it and passes its state to the components that need it.

### A problem

See [CONTRIBUTING.md](../CONTRIBUTING.md). A problem is one migration and one reference solution, and CI judges the solution against the problem's tests.

## Without Docker

The API and the runner can run from a virtualenv against the compose database:

```bash
cd apps/backend
python3.11 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8080 --reload
.venv/bin/python -m app.runner
```

The runner still needs Docker to judge submissions. `ALLOW_UNSANDBOXED=1` makes it judge in its own process instead, which is fine for your own code and never for anyone else's.

## When something goes wrong

- The runner exits with "SANDBOX_IMAGE is not set". Compose sets it; outside compose, set `SANDBOX_IMAGE=python:3.11-slim`.
- Every API call returns 401. `CLERK_ISSUER` in `apps/backend/.env` and the publishable key in `apps/web/.env` must come from the same Clerk instance.
- The editor reconnects once when a room opens. In development React's strict mode opens each socket twice, and the per-user socket caps in `app/websocket/room_chat.py` can refuse the extra one until the first closes. Production builds open each socket once.
- Your local rooms and users are gone after pulling. The Postgres major version changed. The database volume is named after that version (see `apps/backend/docker-compose.yml`), so a new version starts from an empty database instead of failing on the old data files. The old volume is still there; remove it with `docker volume rm <name>` once you no longer need it.
