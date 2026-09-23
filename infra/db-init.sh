#!/bin/sh
# Runs once, when the database volume is first created. The API, runner and
# migrations connect as this role. It owns the app's database, so migrations
# work, but it is not a superuser: no SQL it runs, including a problem
# migration from a contributor, can read server files or start programs.
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE ROLE "$APP_DB_USER" LOGIN PASSWORD '$APP_DB_PASSWORD';
ALTER DATABASE "$POSTGRES_DB" OWNER TO "$APP_DB_USER";
ALTER SCHEMA public OWNER TO "$APP_DB_USER";
SQL
