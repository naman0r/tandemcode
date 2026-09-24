# 0002. A container per run

Status: accepted, 2026-09-23

## Context

Anyone can sign up and submit code, so every submission may be hostile. Resource limits inside the runner's own process stop runaway programs but not a program that reads files or opens connections.

## Decision

Each submission is judged in a new container with no network, a read-only filesystem, an unprivileged user and memory and process caps (`app/runner/sandbox.py`). In production the container runs under gVisor, so the program's system calls go to gVisor's kernel rather than the host's.

## Consequences

- Getting out of the sandbox takes a gVisor bug and then a kernel bug.
- Starting a container adds time to every run.
- The runner holds the host's Docker socket, so it is as trusted as the host. The host runs nothing else.
- The runner judges one submission at a time. More runners, or runners on other hosts, need a change to how work is claimed.
