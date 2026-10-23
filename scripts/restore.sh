#!/usr/bin/env bash
# Restore an encrypted backup.
#
#   scripts/restore.sh <backup.dump.age> <age-identity-file>                 # test restore
#   scripts/restore.sh <backup.dump.age> <age-identity-file> --production    # replace live data
#
# Default (no --production): restores into a scratch database `guitardojo_restore_test`, prints
# row counts, and drops it. Run this monthly to prove backups work.
#
# --production: stops the app, takes a safety backup, replaces the live database in one
# transaction, and starts the app again. The identity file is your PRIVATE age key: copy it to
# the server only for the restore and delete it afterwards.
. "$(dirname "$0")/lib.sh"

BACKUP="${1:?usage: restore.sh <backup.dump.age> <age-identity-file> [--production]}"
IDENTITY="${2:?usage: restore.sh <backup.dump.age> <age-identity-file> [--production]}"
MODE="${3:-test}"
[ -f "$BACKUP" ] || die "no such backup: $BACKUP (download one with: rclone copy <remote>/<file> backups/)"
[ -f "$IDENTITY" ] || die "no such identity file: $IDENTITY"

DB="$(env_get POSTGRES_DB)"; DB="${DB:-guitardojo}"
USER_="$(env_get POSTGRES_USER)"; USER_="${USER_:-guitardojo}"
psql() { compose exec -T db psql -v ON_ERROR_STOP=1 -U "$USER_" "$@"; }

if [ "$MODE" != "--production" ]; then
  SCRATCH="guitardojo_restore_test"
  log "Test restore into scratch database '$SCRATCH'…"
  psql -d postgres -c "DROP DATABASE IF EXISTS $SCRATCH;" -c "CREATE DATABASE $SCRATCH;"
  age -d -i "$IDENTITY" "$BACKUP" | compose exec -T db pg_restore -U "$USER_" -d "$SCRATCH" --no-owner --no-privileges --exit-on-error
  psql -d "$SCRATCH" -c "SELECT (SELECT count(*) FROM \"user\") AS users, (SELECT count(*) FROM progress_event) AS progress_events, (SELECT count(*) FROM drizzle.__drizzle_migrations) AS migrations;"
  psql -d postgres -c "DROP DATABASE $SCRATCH;"
  log "Test restore succeeded. Production data was not touched."
  exit 0
fi

read -r -p "This REPLACES the live '$DB' database with $BACKUP. Type the database name to continue: " CONFIRM
[ "$CONFIRM" = "$DB" ] || die "aborted"

log "Taking a safety backup of the current data first…"
"$ROOT/scripts/backup.sh" pre-restore

log "Stopping the app…"
compose stop app

log "Restoring (single transaction: all or nothing)…"
age -d -i "$IDENTITY" "$BACKUP" \
  | compose exec -T db pg_restore -U "$USER_" -d "$DB" --clean --if-exists --no-owner --no-privileges --single-transaction --exit-on-error

log "Starting the app (pending migrations run first)…"
compose up -d --wait
log "Restore complete. Check https://$(env_get DOMAIN)/api/health and sign in to verify."
