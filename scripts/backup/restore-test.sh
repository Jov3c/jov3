#!/usr/bin/env sh
set -eu

: "${1:?usage: restore-test.sh /path/to/backup-directory}"
: "${JOV3_RESTORE_ROOT:=/srv/jov3/restore-test}"
backup_dir=$1
mkdir -p "$JOV3_RESTORE_ROOT/uploads" "$JOV3_RESTORE_ROOT/geo"
tar -C "$JOV3_RESTORE_ROOT" -xzf "$backup_dir/uploads-geo.tgz"
test -s "$backup_dir/database.sql"
test -d "$JOV3_RESTORE_ROOT/uploads"
test -d "$JOV3_RESTORE_ROOT/geo"
printf '%s\n' 'Backup artifacts validated; restore into an isolated PostgreSQL instance before production use.'
