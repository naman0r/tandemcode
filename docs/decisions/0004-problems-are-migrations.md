# 0004. Problems are migrations

Status: accepted, 2026-09-23

## Context

People outside the project should be able to add problems, and a problem with a wrong test is worse than no problem.

## Decision

A problem is one SQL migration that inserts it and one reference solution in `apps/backend/tests/solutions/`. It arrives as a pull request. CI judges the reference solution against every test, and checks that the migration is exactly one `INSERT` of the expected shape, because migrations run on deploy. [CONTRIBUTING.md](../../CONTRIBUTING.md) is the guide.

## Consequences

- Every problem is reviewed, and its tests are proven by a solution that passes them.
- Every environment gets the same problems by running the same migrations.
- Hidden tests are public, in the migrations. They keep examples short, but they do not stop someone who reads the repository.
- Changing a problem after it merges takes a new migration.
