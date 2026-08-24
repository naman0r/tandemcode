"""Everything the app reads from the environment, in one place.

This module is imported before anything else touches the database, so `.env` is
loaded exactly once and every other module sees the same values.
"""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[2]

# Real environment variables win; the file only fills in what they leave unset.
load_dotenv(BACKEND_ROOT / ".env")


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is not set. Copy .env.example to .env and fill it in.")
    return value


DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5433")
DB_NAME = os.getenv("DB_NAME", "tandemcode_dev")
DB_USER = os.getenv("DB_USER", "tandemcode")
# No default on purpose. A fallback password is how credentials end up committed.
DB_PASSWORD = _required("DB_PASSWORD")

# quote_plus keeps the URL valid when the password contains @ : / or #
DATABASE_URL = (
    f"postgresql://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

# Flyway migrated on every Spring Boot start; keep doing that.
RUN_MIGRATIONS_ON_STARTUP = os.getenv("RUN_MIGRATIONS_ON_STARTUP", "true").lower() in {
    "1",
    "true",
    "yes",
}
