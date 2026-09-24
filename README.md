# TandemCode

Practice coding problems with a partner. Two people share a room, edit the same code, chat, and run their solution against the problem's tests together. Afterwards the whole session can be replayed.

It runs at [tandemcode.space](https://tandemcode.space). It is free and open source under the Apache License 2.0.

## What it does

- Rooms that are public or unlisted, shared by invite link, with a way to ask for a partner.
- One shared editor with live cursors, built on Yjs.
- Problems with starter code, visible examples and hidden tests, added by pull request.
- Python submissions judged in an isolated container per run, with the verdict shown to everyone in the room.
- A replay of each session: the code as it was typed, the chat and every run.

## Run it locally

You need Docker, Node 22 and a free Clerk application.

```bash
make setup    # copy the .env templates, install web dependencies
              # then fill in the Clerk keys and a DB password
make up       # Postgres, the API and the runner
make web      # http://localhost:5173
```

[docs/development.md](docs/development.md) has the details, the checks and the common changes.

## Stack

- Web: React 19, Vite, TypeScript, Tailwind, Monaco, Yjs, Clerk.
- API: FastAPI on Python 3.11 with asyncpg, HTTP plus two websockets.
- Runner: the API's image running `python -m app.runner`, judging in Docker containers under gVisor.
- Database: Postgres 17 with forward-only SQL migrations.
- Production: one Linux host with Docker Compose and Caddy, and the web app on Vercel.

## Docs

- [Development](docs/development.md)
- [Architecture](docs/architecture.md)
- [Judge and sandbox](docs/judge-and-sandbox.md)
- [Self-hosting](docs/self-hosting.md)
- [Decisions](docs/decisions/)

## Contributing

Pull requests are welcome, and adding a problem is the easiest place to start. [CONTRIBUTING.md](CONTRIBUTING.md) explains both. Report security issues privately as described in [SECURITY.md](SECURITY.md).
