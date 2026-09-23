#!/usr/bin/env bash
# Pull the latest main and rebuild whatever changed. Migrations run when the
# API starts.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
# Migrations run when the new API starts and cannot be undone, so take a dump
# first. Skipped on the first deploy, before there is a database.
if docker compose -f infra/docker-compose.prod.yml ps --status running --services | grep -qx db; then
  ./infra/backup.sh
fi
docker compose -f infra/docker-compose.prod.yml up -d --build --remove-orphans
docker image prune -f > /dev/null
docker compose -f infra/docker-compose.prod.yml ps
