"""Migration discovery rules (the part that replaced Flyway's file scanning)."""

from __future__ import annotations

import pytest

from app.migrate import MIGRATIONS_DIR, discover_migrations


def test_real_migrations_are_discovered_in_version_order():
    migrations = discover_migrations()
    assert [m.version for m in migrations] == [1, 2, 3]
    assert migrations[0].description == "init"
    assert migrations[2].description == "seed problems"


def test_every_sql_file_in_the_repo_is_a_recognised_migration():
    sql_files = {p.name for p in MIGRATIONS_DIR.glob("*.sql")}
    discovered = {m.path.name for m in discover_migrations()}
    assert sql_files == discovered


def test_files_that_are_not_migrations_are_ignored(tmp_path):
    (tmp_path / "V1__ok.sql").write_text("SELECT 1;")
    (tmp_path / "notes.sql").write_text("SELECT 2;")
    (tmp_path / "V__missing_version.sql").write_text("SELECT 3;")

    assert [m.version for m in discover_migrations(tmp_path)] == [1]


def test_duplicate_versions_are_rejected(tmp_path):
    (tmp_path / "V1__first.sql").write_text("SELECT 1;")
    (tmp_path / "V1__second.sql").write_text("SELECT 2;")

    with pytest.raises(RuntimeError, match="Duplicate migration version 1"):
        discover_migrations(tmp_path)


def test_versions_sort_numerically_not_lexicographically(tmp_path):
    for version in (2, 10, 1):
        (tmp_path / f"V{version}__step.sql").write_text("SELECT 1;")

    assert [m.version for m in discover_migrations(tmp_path)] == [1, 2, 10]


def test_migration_sql_is_read_from_disk(tmp_path):
    (tmp_path / "V7__thing.sql").write_text("SELECT 42;")
    assert discover_migrations(tmp_path)[0].read_sql() == "SELECT 42;"
