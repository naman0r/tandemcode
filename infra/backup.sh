#!/usr/bin/env bash
# Dump the database to /var/backups/tandemcode and keep 14 days of dumps.
# Lightsail's automatic snapshots copy the disk, dumps included, off the box;
# they are off until turned on in the Lightsail console.
#
# Restore into an empty database, never over a live one:
#   docker compose -f infra/docker-compose.prod.yml stop api runner
#   docker compose -f infra/docker-compose.prod.yml exec -T db dropdb -U postgres "$DB_NAME"
#   docker compose -f infra/docker-compose.prod.yml exec -T db createdb -U postgres -O "$DB_USER" "$DB_NAME"
#   gunzip -c FILE | docker compose -f infra/docker-compose.prod.yml exec -T db psql -v ON_ERROR_STOP=1 -U "$DB_USER" "$DB_NAME"
#   docker compose -f infra/docker-compose.prod.yml start api runner
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . infra/.env; set +a
out="/var/backups/tandemcode/tandemcode-$(date +%F-%H%M).sql.gz"
docker compose -f infra/docker-compose.prod.yml exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$out.tmp"
mv "$out.tmp" "$out"
find /var/backups/tandemcode -name 'tandemcode-*.sql.gz' -mtime +14 -delete
