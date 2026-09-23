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
- Complexity estimates, counterexamples, languages other than Python.

## Stack

| Piece | Choice |
| --- | --- |
| Web | React 19, Vite, TypeScript, Tailwind, Monaco, Yjs, Clerk |
| API | FastAPI on Python 3.11, asyncpg, raw JSON over websockets |
| Runner | Same image as the API, `python -m app.runner` |
| Database | Postgres 17 in production and CI (13 in the local compose), forward-only SQL migrations in `apps/backend/migrations` |
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
infra/             production compose, Caddy, host scripts
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

Migrations run when the API starts. The runner waits for the API's health
check, so it never sees a half-migrated schema.

To serve the built web app from nginx instead of Vite, add
`VITE_CLERK_PUBLISHABLE_KEY` to apps/backend/.env and run
`docker compose --profile prod up -d --build`. The app is on port 3000.

To run the API outside Docker instead:

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

## Sandbox

With `SANDBOX_IMAGE` set, as it is in docker compose, the runner judges each
submission in a fresh container from that image: no network, read-only root,
a 64 MB `/tmp`, uid 65534, all capabilities dropped, a memory cap and 32
processes. Without it the runner refuses to start, unless `ALLOW_UNSANDBOXED=1`
is set, in which case it judges in-process with rlimits only: fine for tests,
not for strangers' code. Output of hidden tests is never returned.

Containers share the host kernel, so one kernel bug is enough to escape them.
With `SANDBOX_RUNTIME=runsc` each judge container runs under gVisor, which
handles the program's system calls in its own user-space kernel; production
sets it, and `infra/install-gvisor.sh` installs it on an Ubuntu host.

The runner reaches Docker through the host's socket, so the runner itself is
as trusted as the host. Keep it on a machine that runs nothing else.

## Deploy

One Lightsail host for the API, runner and Postgres, and Vercel for the web
app. `docs/deploy.md` has every step.

## Contributing

`AGENTS.md` has the rules for agents and the same checks as above.
