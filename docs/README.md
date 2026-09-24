# Docs

Start with the page for what you are doing.

- [Development](development.md): run TandemCode locally, run the checks, and make common changes.
- [Architecture](architecture.md): the parts of the system, how a request and a run move through them, and where each piece lives in the code.
- [Judge and sandbox](judge-and-sandbox.md): how submissions are judged and what isolates them.
- [Self-hosting](self-hosting.md): run your own instance on one Linux host.
- [Decisions](decisions/): why the system is shaped the way it is.

Adding a problem is in [CONTRIBUTING.md](../CONTRIBUTING.md).

## Keeping these pages current

These pages go stale when they copy what the code already says. So they follow a few rules:

1. Explain what and why. Leave exact values in the code. A page names the constant or file that holds a limit, port or timeout (`MAX_SOCKETS_PER_USER` in `app/websocket/room_chat.py`), and does not repeat its value.
2. Link to files and directories, not line numbers.
3. Change a page in the same pull request as the behaviour it describes. The pull request template asks.
4. Decision records are written once and not edited. When a decision changes, add a new record that replaces the old one, and mark the old one as replaced.
5. CI checks every relative link in the repository's Markdown, so a moved or deleted file fails the build.
