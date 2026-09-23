"""Problem migrations come from outside contributors and run on deploy.

The check a pull request that adds a problem has to pass: its migration is one
INSERT INTO problems and nothing else. SQL cannot be matched with a regex
alone, since a statement can hide inside what looks like a string or comment,
so this scans it the way Postgres does first.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.migrate import MIGRATION_PATTERN, MIGRATIONS_DIR

# Migrations up to here were written by the maintainers.
LAST_REVIEWED_VERSION = 12

PROBLEM_INSERT = re.compile(
    r"INSERT INTO problems \( slug , title , difficulty , time_limit_ms , mem_limit_mb ,"
    r" statement , starter_code , tests \) VALUES \( S , S , S , \d+ , \d+ , D , D , D :: jsonb \) ;?",
    re.IGNORECASE,
)


def skeleton(sql: str) -> str:
    """The SQL with strings as S or D, comments removed and spacing normalised.

    Anything the scanner is unsure of is left in, which makes the shape check
    fail rather than pass: nested block comments end early here, and an
    E'' string leaves its E behind.
    """
    out, i = [], 0
    while i < len(sql):
        if sql.startswith("--", i):
            end = sql.find("\n", i)
            i = len(sql) if end == -1 else end
        elif sql.startswith("/*", i):
            end = sql.find("*/", i + 2)
            i = len(sql) if end == -1 else end + 2
        elif sql[i] == "'":
            i += 1
            while i < len(sql) and not (sql[i] == "'" and not sql.startswith("''", i)):
                i += 2 if sql.startswith("''", i) else 1
            i += 1
            out.append(" S ")
        elif match := re.match(r"\$([A-Za-z_]\w*)?\$", sql[i:]):
            tag = match.group(0)
            end = sql.find(tag, i + len(tag))
            i = len(sql) if end == -1 else end + len(tag)
            out.append(" D ")
        else:
            out.append(sql[i])
            i += 1
    spaced = re.sub(r"([(),;]|::)", r" \1 ", "".join(out))
    return " ".join(spaced.split())


def contributed_migrations() -> list[Path]:
    files = []
    for path in sorted(MIGRATIONS_DIR.glob("V*.sql")):
        version, description = MIGRATION_PATTERN.match(path.name).groups()
        if int(version) <= LAST_REVIEWED_VERSION:
            continue
        if description.startswith("add_") or "insert into problems" in skeleton(path.read_text()).lower():
            files.append(path)
    return files


@pytest.mark.parametrize("path", contributed_migrations(), ids=lambda path: path.name)
def test_a_problem_migration_only_inserts_one_problem(path):
    assert PROBLEM_INSERT.fullmatch(skeleton(path.read_text())), (
        f"{path.name} must be exactly one INSERT INTO problems, as in CONTRIBUTING.md"
    )


GOOD = """-- V13: Add a problem
INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES ('x', 'It''s fine -- really', 'easy', 2000, 256, $$a -- not a comment$$, $s$ holds $$ inside $s$, $$[]$$::jsonb);
"""


@pytest.mark.parametrize(
    "sql",
    [
        GOOD.replace("$$a -- not a comment$$", "$$a$$; DROP TABLE users; SELECT $$b$$"),
        GOOD.replace("$$a -- not a comment$$", "$$a -- $$; DROP TABLE users; --\n$$"),
        GOOD.replace("'It''s fine -- really'", "'x'); DELETE FROM users; --'"),
        GOOD.replace("'It''s fine -- really'", "E'\\''); DELETE FROM users; --'"),
        GOOD + "UPDATE problems SET statement = (SELECT string_agg(email, ',') FROM users);",
        GOOD.replace("2000", "(SELECT 1)"),
    ],
    ids=["dollar-breakout", "comment-in-string", "quote-breakout", "e-string", "second-statement", "subquery"],
)
def test_the_shape_check_refuses_smuggled_sql(sql):
    assert not PROBLEM_INSERT.fullmatch(skeleton(sql))


def test_the_shape_check_accepts_the_documented_form():
    assert PROBLEM_INSERT.fullmatch(skeleton(GOOD))
