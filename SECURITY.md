# Security

## Reporting a vulnerability

Report it privately through GitHub: open the repository's Security tab and choose "Report a vulnerability". Please do not open a public issue or pull request for it. Include what you found, how to reproduce it, and what it lets someone do.

Only tandemcode.space and the latest `main` are supported. Fixes land on `main` and are deployed from there.

## In scope

- Getting out of the judge's sandbox, or running code on the host.
- Signing in as someone else, or acting as another user.
- Reading or changing a room, its runs or its chat without having been in it.
- Taking the site down, or running up its hosting bill, from one account.

The protections are described in [docs/judge-and-sandbox.md](docs/judge-and-sandbox.md) and [docs/architecture.md](docs/architecture.md).

## Not a vulnerability

- Reading a problem's hidden tests. They are public in the migrations that add them.
- Findings that need access to the host, the database or a maintainer's account.

Please test against your own local copy rather than tandemcode.space, and never against other people's rooms or accounts.
