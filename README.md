# TandemCode

Real-time pair programming with a judge. Two people share a room, edit the same
code in a Monaco editor, chat, pick a problem, and run their solution against
hidden tests.

## What works today

- Clerk sign-in. Every API route and both websockets verify a session token.
- Rooms: create, join by id, presence, chat, owner assigns a problem.
- Shared editor: Yjs over a websocket relay, one document per room.
- Problems: statement, starter code, public samples, hidden tests. Five of the
  fifteen seeded problems have content.
- Run: a runner process judges Python submissions against the tests with time
  and memory limits and the room shows the verdict and the first failing test.

## What does not exist yet

- Any AWS piece. The README used to plan SQS, Fargate, S3 and RDS; none of it
  is built. The runner takes work from the submissions table. See #33.
- Session replay. The events table is empty. See #34.
- Complexity estimates, counterexamples, languages other than Python.

## Stack

| Piece | Choice |
| --- | --- |
| Web | React 19, Vite, TypeScript, Tailwind, Monaco, Yjs, Clerk |
| API | FastAPI on Python 3.11, asyncpg, raw JSON over websockets |
| Runner | Same image as the API, `python -m app.runner` |
| Database | Postgres 13, forward-only SQL migrations in `apps/backend/migrations` |
| CI | pytest with a Postgres service; web lint and build |

## Layout

```
apps/
  backend/
    app/
      core/        settings, Clerk token verification
      routes/      HTTP endpoints
      services/    rules, take an authenticated caller id
      dao/         all SQL
      websocket/   room chat and Yjs relay
      runner/      judge and the polling worker
    migrations/    V<n>__<name>.sql
    tests/
  web/
    src/
      routes/      pages: /, /dashboard, /rooms, /rooms/create, /rooms/join, /rooms/:id, /problems
      components/  editor, chat, members, header
      hooks/       room websocket
      lib/         API client, auth, config
docs/history/      notes from the Spring Boot version
```

Requests flow routes to services to dao. Authentication happens at the HTTP
and websocket boundary; services never see a token.

## Run it locally

You need Docker, Node 20.19 or later, and a Clerk application.

```bash
cd apps/backend
cp .env.example .env         # set DB_PASSWORD, CLERK_ISSUER, CLERK_SECRET_KEY
docker compose up -d --build # db on 5433, api on 8080, runner

cd ../web
cp .env.template .env        # set VITE_CLERK_PUBLISHABLE_KEY
npm install
npm run dev                  # http://localhost:5173
```

Migrations run when the API starts. To run the API outside Docker instead:

```bash
cd apps/backend
python3.11 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8080 --reload
.venv/bin/python -m app.runner
```

## Checks

```bash
cd apps/backend && docker compose run --rm -v "$PWD:/workspace" backend \
  sh -lc 'cd /workspace && HOME=/tmp pip install -r requirements-dev.txt && HOME=/tmp python -m pytest'
cd apps/web && npm run lint && npm run build
```

Tests use a `tandemcode_test` database that is dropped and recreated per run.

## Judge contract

A problem's tests are `[{"input", "expected", "hidden"}]`. The program reads
stdin and prints; a test passes when trimmed stdout equals the trimmed
expected string. The runner stops at the first failure. Statuses are
`accepted`, `wrong_answer`, `runtime_error` and `time_limit_exceeded`. The
judge is a pure function in `apps/backend/app/runner/judge.py`, so a hosted
runner can call the same thing.

## Contributing

Every pull request closes an issue. `AGENTS.md` has the rules for agents and
the same checks as above.
