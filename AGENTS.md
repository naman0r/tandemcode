# AGENTS.md

## Local checks

- Backend: `cd apps/backend && docker compose up -d db && docker compose run --rm -v "$PWD:/workspace" backend sh -lc 'cd /workspace && HOME=/tmp pip install -r requirements-dev.txt && HOME=/tmp python -m pytest'`
- Web: `cd apps/web && npm run lint && npm run build`

## Layout

- Backend requests flow through `routes/` to `services/` to `dao/`; SQL stays in `dao/`.
- Authentication happens at the HTTP and websocket boundaries. Services receive an authenticated caller id.
- The web app keeps one room websocket per room and passes its state down as props.
