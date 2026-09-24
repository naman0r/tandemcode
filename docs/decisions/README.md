# Decisions

Each record explains one choice that shapes the system, and why. Records are not edited after they are merged. When a decision changes, add a new record, and change the old one's status line to `Replaced by NNNN` so the history stays readable.

- [0001](0001-one-host-for-the-backend.md): the API, runner and database share one host; the web app is hosted separately
- [0002](0002-a-container-per-run.md): each submission runs in its own container, under gVisor in production
- [0003](0003-the-server-relays-the-editor.md): the server relays the shared editor and keeps no copy of it
- [0004](0004-problems-are-migrations.md): problems are added by migration, through pull requests

## Writing one

Copy this into `NNNN-short-title.md`, numbered after the last record:

```markdown
# NNNN. Title

Status: accepted, YYYY-MM-DD

## Context

What forced a choice.

## Decision

What was chosen.

## Consequences

What this makes easy, what it makes hard, and what would make it worth revisiting.
```
