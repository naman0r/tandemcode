## commands

```bash
# one-time: create apps/backend/.env from the template and set DB_PASSWORD
cd apps/backend && cp .env.example .env

# database
cd apps/backend && docker compose up -d db

# backend (port 8080)
cd apps/backend && source .venv/bin/activate && uvicorn app.main:app --port 8080 --reload

# frontend (port 5173)
cd apps/web && npm run dev
```
