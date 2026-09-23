#!/usr/bin/env bash
# Pull the latest main and rebuild whatever changed. Migrations run when the
# API starts.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
docker compose -f infra/docker-compose.prod.yml up -d --build --remove-orphans
docker image prune -f > /dev/null
docker compose -f infra/docker-compose.prod.yml ps
