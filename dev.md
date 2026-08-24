## commands

Run from the repository root. Each block is its own terminal.

### One-time setup

```bash
cd apps/backend
cp .env.example .env          # then set DB_PASSWORD
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

cd ../web && npm install
```

### Terminal 1 - database

```bash
(cd apps/backend && docker compose up -d db)
```

### Terminal 2 - backend, port 8080

```bash
(cd apps/backend && .venv/bin/uvicorn app.main:app --port 8080 --reload)
```

### Terminal 3 - frontend, port 5173

```bash
(cd apps/web && npm run dev)
```

Then open http://localhost:5173.

Migrations run automatically when the backend boots. To apply them by hand:

```bash
(cd apps/backend && .venv/bin/python -m app.migrate)
```
