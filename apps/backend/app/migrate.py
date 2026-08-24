"""Forward-only SQL migration runner.

Replaces the Flyway integration that used to live in the Spring Boot app. Files
in ``apps/backend/migrations`` named ``V<n>__<description>.sql`` are applied in
numeric order, once each, and recorded in the ``schema_version`` table.
"""

from __future__ import annotations

import asyncio
import logging
import re
from dataclasses import dataclass
from pathlib import Path

import asyncpg

from app.core.config import BACKEND_ROOT, DATABASE_URL

logger = logging.getLogger(__name__)

MIGRATIONS_DIR = BACKEND_ROOT / "migrations"
MIGRATION_PATTERN = re.compile(r"^V(\d+)__(.+)\.sql$")

# Arbitrary but fixed: stops two instances migrating the same database at once.
ADVISORY_LOCK_KEY = 8_675_309

CREATE_SCHEMA_VERSION = """
    CREATE TABLE IF NOT EXISTS schema_version (
        version     INT PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
"""


@dataclass(frozen=True)
class Migration:
    version: int
    description: str
    path: Path

    def read_sql(self) -> str:
        return self.path.read_text()


def discover_migrations(directory: Path = MIGRATIONS_DIR) -> list[Migration]:
    """Return migrations sorted by version, rejecting duplicate version numbers."""
    found: dict[int, Migration] = {}
    for path in sorted(directory.glob("*.sql")):
        match = MIGRATION_PATTERN.match(path.name)
        if not match:
            logger.warning("Ignoring file that is not named V<n>__<name>.sql: %s", path.name)
            continue
        version = int(match.group(1))
        if version in found:
            raise RuntimeError(
                f"Duplicate migration version {version}: "
                f"{found[version].path.name} and {path.name}"
            )
        found[version] = Migration(version, match.group(2).replace("_", " "), path)
    return [found[version] for version in sorted(found)]


async def _adopt_flyway_history(conn: asyncpg.Connection) -> None:
    """Mark migrations Flyway already ran as applied so they are not repeated.

    Existing development databases were migrated by Flyway from the Spring app.
    V2 (``ALTER TABLE ... ADD COLUMN``) and V3 (seed with a UNIQUE slug) are not
    idempotent, so re-running them against such a database would fail.
    """
    has_flyway = await conn.fetchval("SELECT to_regclass('flyway_schema_history') IS NOT NULL")
    if not has_flyway:
        return

    rows = await conn.fetch(
        """
        SELECT version, description
        FROM flyway_schema_history
        WHERE success AND version IS NOT NULL
        """
    )

    adopted = []
    for row in rows:
        raw_version = str(row["version"]).strip()
        if not raw_version.isdigit():
            logger.warning("Skipping non-integer Flyway version %r", raw_version)
            continue
        adopted.append((int(raw_version), row["description"] or "adopted from flyway"))

    if not adopted:
        return

    await conn.executemany(
        """
        INSERT INTO schema_version (version, description)
        VALUES ($1, $2)
        ON CONFLICT (version) DO NOTHING
        """,
        adopted,
    )
    logger.info("Adopted %d migration(s) from existing Flyway history", len(adopted))


async def apply_migrations(conn: asyncpg.Connection) -> list[Migration]:
    """Apply every pending migration and return the ones that ran."""
    await conn.execute(CREATE_SCHEMA_VERSION)
    await conn.execute("SELECT pg_advisory_lock($1)", ADVISORY_LOCK_KEY)
    try:
        await _adopt_flyway_history(conn)

        applied_versions = {
            row["version"] for row in await conn.fetch("SELECT version FROM schema_version")
        }
        pending = [m for m in discover_migrations() if m.version not in applied_versions]

        for migration in pending:
            logger.info("Applying V%d__%s", migration.version, migration.description)
            async with conn.transaction():
                await conn.execute(migration.read_sql())
                await conn.execute(
                    "INSERT INTO schema_version (version, description) VALUES ($1, $2)",
                    migration.version,
                    migration.description,
                )
        return pending
    finally:
        await conn.execute("SELECT pg_advisory_unlock($1)", ADVISORY_LOCK_KEY)


async def migrate() -> list[Migration]:
    conn = await asyncpg.connect(dsn=DATABASE_URL)
    try:
        return await apply_migrations(conn)
    finally:
        await conn.close()


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    applied = await migrate()
    if applied:
        for migration in applied:
            print(f"applied V{migration.version}__{migration.description}")
    else:
        print("database is up to date; nothing to apply")


if __name__ == "__main__":
    asyncio.run(main())
