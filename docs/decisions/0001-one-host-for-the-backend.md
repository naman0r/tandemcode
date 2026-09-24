# 0001. One host for the backend

Status: accepted, 2026-09-23

## Context

The runner starts a container for every submission, so it needs a Docker daemon. The managed container platforms considered do not give a container access to one. The project also has no budget beyond a few dollars a month, and a launch on public forums can bring bursts of traffic.

## Decision

The API, the runner, Postgres and Caddy run with Docker Compose on one Linux host (`infra/docker-compose.prod.yml`). tandemcode.space uses a 2 GB AWS Lightsail instance, which has a fixed monthly price with transfer included. The web app is a static build on Vercel, which deploys every push to `main`. The API deploys by hand with `infra/deploy.sh`.

## Consequences

- The whole backend costs one flat monthly price, and nothing in it scales its bill with traffic.
- Moving hosts is a dump, a restore and a DNS change, because the host runs nothing but Compose.
- One host is one point of failure. Automatic disk snapshots and nightly dumps cover data loss, not downtime.
- The runner shares a machine with the API, so a heavy judging load slows the API. Separate judge hosts are the next step if that happens.
