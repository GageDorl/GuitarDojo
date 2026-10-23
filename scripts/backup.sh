#!/usr/bin/env bash
# Encrypted, off-server PostgreSQL backup.
#
#   pg_dump (custom format) -> age encryption (public key only on this server) -> backups/
#   -> rclone copy to off-site storage -> prune old copies locally and remotely.
#
# Runs from cron/systemd (see docs/DEPLOYMENT.md) and before every deploy.
# Exits non-zero on ANY failure so monitoring can alert.
. "$(dirname "$0")/lib.sh"

command -v age >/dev/null || die "age is not installed (apt install age)"
command -v rclone >/dev/null || die "rclone is not installed (see docs/DEPLOYMENT.md)"

DB="$(env_get POSTGRES_DB)"; DB="${DB:-guitardojo}"
USER_="$(env_get POSTGRES_USER)"; USER_="${USER_:-guitardojo}"
RECIPIENT="$(env_get BACKUP_AGE_RECIPIENT)"
REMOTE="$(env_get BACKUP_RCLONE_REMOTE)"
KEEP_LOCAL="$(env_get BACKUP_KEEP_LOCAL_DAYS)"; KEEP_LOCAL="${KEEP_LOCAL:-7}"
KEEP_REMOTE="$(env_get BACKUP_KEEP_REMOTE_DAYS)"; KEEP_REMOTE="${KEEP_REMOTE:-35}"
[[ "$RECIPIENT" == age1* ]] || die "BACKUP_AGE_RECIPIENT must be an age public key (age1...)"
[ -n "$REMOTE" ] || die "BACKUP_RCLONE_REMOTE is not set"

mkdir -p backups
chmod 700 backups
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LABEL="${1:-scheduled}"
FILE="backups/guitardojo-${STAMP}-${LABEL}.dump.age"

log "Dumping database '$DB'…"
compose exec -T db pg_dump -U "$USER_" -d "$DB" --format=custom --compress=6 --no-owner --no-privileges \
  | age -r "$RECIPIENT" > "$FILE.partial"
mv "$FILE.partial" "$FILE"
SIZE=$(stat -c %s "$FILE")
[ "$SIZE" -gt 1024 ] || die "backup is suspiciously small ($SIZE bytes)"
log "Wrote $FILE ($SIZE bytes)"

log "Uploading to $REMOTE…"
rclone copy "$FILE" "$REMOTE" --immutable
rclone lsf "$REMOTE" --include "$(basename "$FILE")" | grep -q . || die "upload not found on remote"

log "Pruning: local > ${KEEP_LOCAL}d, remote > ${KEEP_REMOTE}d"
find backups -name 'guitardojo-*.dump.age' -mtime "+$KEEP_LOCAL" -delete
rclone delete "$REMOTE" --min-age "${KEEP_REMOTE}d" --include 'guitardojo-*.dump.age'

log "Backup complete."
