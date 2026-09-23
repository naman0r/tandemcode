#!/usr/bin/env bash
# Dump the database to /var/backups/tandemcode and keep 14 days of dumps.
# Lightsail's automatic snapshots copy the disk, dumps included, off the box.
# Restore: gunzip -c FILE | docker compose -f infra/docker-compose.prod.yml exec -T db psql -U tandemcode tandemcode
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . infra/.env; set +a
out="/var/backups/tandemcode/tandemcode-$(date +%F).sql.gz"
docker compose -f infra/docker-compose.prod.yml exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$out.tmp"
mv "$out.tmp" "$out"
find /var/backups/tandemcode -name 'tandemcode-*.sql.gz' -mtime +14 -delete
