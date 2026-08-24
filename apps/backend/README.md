# FastAPI backend

This backend mirrors the existing Spring Boot API and websocket contract so the frontend can keep using the same paths:

- `http://localhost:8080/api/*`
- `ws://localhost:8080/ws/room/{roomId}`
- `ws://localhost:8080/ws/yjs/{roomId}`

## Run

1. Start Postgres from the existing Docker Compose file in `apps/api`:

```bash
cd apps/api
docker compose up -d
```

2. Install dependencies:

```bash
cd apps/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Run the backend with uvicorn on port `8080`:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

## Notes

- The backend uses the existing Postgres schema and Docker database.
- CORS defaults to `http://localhost:5173`.
- Room chat and Yjs collaboration paths are preserved.
- To redirect Python bytecode caches into a single backend-level folder instead of per-package `__pycache__` directories, set:

```bash
export PYTHONPYCACHEPREFIX="$(pwd)/.pycache"
```
