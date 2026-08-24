from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[2]

# Load apps/backend/.env. Real environment variables always win over the file,
# so container/CI config keeps overriding local development values.
load_dotenv(BACKEND_ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    db_host: str = field(default_factory=lambda: os.getenv("DB_HOST", "localhost"))
    db_port: int = field(default_factory=lambda: int(os.getenv("DB_PORT", "5433")))
    db_name: str = field(default_factory=lambda: os.getenv("DB_NAME", "tandemcode_dev"))
    db_user: str = field(default_factory=lambda: os.getenv("DB_USER", "tandemcode"))
    db_password: str = field(default_factory=lambda: os.getenv("DB_PASSWORD", "tandemcode"))
    cors_origins_raw: str = field(
        default_factory=lambda: os.getenv("CORS_ORIGINS", "http://localhost:5173")
    )
    # Flyway ran on every Spring Boot start, so keep migrating on boot by default.
    run_migrations_on_startup: bool = field(
        default_factory=lambda: os.getenv("RUN_MIGRATIONS_ON_STARTUP", "true").lower()
        in {"1", "true", "yes"}
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def database_url(self) -> str:
        # Credentials are percent-encoded so passwords containing @ : / # stay valid.
        return (
            f"postgresql://{quote_plus(self.db_user)}:{quote_plus(self.db_password)}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


settings = Settings()
