# AGENTS.md

## Local checks

- Everything CI runs: `make check`. `make` lists the other commands.
- Backend only: `make test` (runs pytest in the API image against the compose database).
- Web only: `make lint` (lint and production build).

## Docs

- Start at `docs/README.md`. `docs/architecture.md` says where each part of the system lives.
- A change to how something works updates the page that describes it, in the same pull request.
- Docs name the constant or file that holds a value; they do not copy the value.
- `docs/decisions/` records are never edited. A changed decision gets a new record.
- `docs/internal/` is gitignored and never committed.

## Content rules

- Never add emoji to code, comments, documentation, commit messages, PR text, or generated files. Remove emoji when you find them.

## Layout

- Backend requests flow through `routes/` to `services/` to `dao/`; SQL stays in `dao/`.
- Authentication happens at the HTTP and websocket boundaries. Services receive an authenticated caller id.
- The web app keeps one room websocket per room and passes its state down as props.
