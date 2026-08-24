# PR workflow

Every pull request closes a GitHub issue. A CI check enforces the link.

## Opening a PR

The description template puts the reference at the top:

```
Closes #12
```

Accepted keywords are `closes`, `fixes` and `resolves`, in any tense. On merge
the issue closes on its own and the PR appears in its Development sidebar.

`Refs #12` by itself does not satisfy the check — a plain mention neither closes
the issue nor creates that link. Doing partial work? Open a smaller issue this PR
does close, and reference the parent with `Refs` on a separate line.

## The check

`linked ticket` runs on every PR and:

- parses the description for a closing keyword
- confirms the number is a real issue, not a pull request
- comments with the ticket's title, state, assignee and labels

It re-runs when the description is edited, so fixing a missing reference does not
need a new commit. HTML comments are stripped before parsing, so the example
inside the template does not count as a link.

## Bypassing it

Apply the `no-ticket` label, for hotfixes or work with genuinely no ticket. The
check re-runs when labels change.

## Making it a merge blocker

It is report-only today: a failing check is visible but blocks nothing. To
enforce, with no code change:

> Settings → Branches → add a rule for `main` → Require status checks to pass →
> select `linked ticket`

## Files

| Path | |
|---|---|
| `.github/PULL_REQUEST_TEMPLATE.md` | the description template |
| `.github/workflows/pr-ticket.yml` | the check |
