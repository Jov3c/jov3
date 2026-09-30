#!/usr/bin/env sh
set -eu

: "${JOV3_DATA_ROOT:=/srv/jov3/data}"
: "${JOV3_BACKUP_ROOT:=/srv/jov3/backups}"
: "${COMPOSE_FILE:=docker-compose.production.yml}"

timestamp=$(date -u +%Y%m%dT%H%M%SZ)
daily="$JOV3_BACKUP_ROOT/daily/$timestamp"
mkdir -p "$daily"

docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$daily/database.sql"
tar -C "$JOV3_DATA_ROOT" -czf "$daily/uploads-geo.tgz" uploads geo

find "$JOV3_BACKUP_ROOT/daily" -mindepth 1 -maxdepth 1 -type d -mtime +6 -exec rm -rf {} +
mkdir -p "$JOV3_BACKUP_ROOT/weekly"
if [ "$(date -u +%u)" = "7" ]; then
  cp -a "$daily" "$JOV3_BACKUP_ROOT/weekly/$timestamp"
  find "$JOV3_BACKUP_ROOT/weekly" -mindepth 1 -maxdepth 1 -type d -mtime +27 -exec rm -rf {} +
fi
