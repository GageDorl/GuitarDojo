#!/usr/bin/env bash
# Deploy the currently checked-out commit.
#
#   git pull --ff-only && scripts/deploy.sh
#
# 1. Backs up the database (if it's running).  2. Builds images tagged with the commit.
# 3. Runs migrations, then starts the new app; waits until healthy.  4. Records the version.
# On failure nothing is switched over except migrations; see scripts/rollback.sh.
. "$(dirname "$0")/lib.sh"

VERSION="$(git rev-parse --short=12 HEAD)"
PREVIOUS="$(env_get APP_VERSION)"
git diff --quiet || die "working tree has uncommitted changes; deploy a clean commit"

# Off-site backups need a real age public key and an existing rclone remote (docs/DEPLOYMENT.md, step 5).
offsite_backups_configured() {
  local recipient remote
  recipient="$(env_get BACKUP_AGE_RECIPIENT)"
  remote="$(env_get BACKUP_RCLONE_REMOTE)"
  [[ "$recipient" == age1* && "$recipient" != age1replace* ]] || return 1
  command -v age >/dev/null && command -v rclone >/dev/null || return 1
  rclone listremotes 2>/dev/null | grep -qxF "${remote%%:*}:"
}

if compose ps --status running db 2>/dev/null | grep -q db; then
  if offsite_backups_configured; then
    log "Pre-deploy backup…"
    "$ROOT/scripts/backup.sh" "pre-deploy-$VERSION"
  else
    # Unencrypted, but root-only and on the same disk as the live database it copies.
    log "WARNING: off-site backups aren't configured; keeping a LOCAL pre-deploy dump only."
    mkdir -p backups && chmod 700 backups
    DUMP="backups/guitardojo-$(date -u +%Y%m%dT%H%M%SZ)-pre-deploy-$VERSION.dump"
    compose exec -T db pg_dump -U "$(env_get POSTGRES_USER)" -d "$(env_get POSTGRES_DB)" \
      --format=custom --compress=6 --no-owner --no-privileges > "$DUMP.partial"
    mv "$DUMP.partial" "$DUMP" && chmod 600 "$DUMP"
    log "Wrote $DUMP ($(stat -c %s "$DUMP") bytes)"
  fi
else
  log "Database not running yet (first deploy?): skipping pre-deploy backup."
fi

log "Building $VERSION…"
APP_VERSION="$VERSION" compose build --pull

log "Migrating and starting $VERSION…"
env_set APP_VERSION "$VERSION"
if ! APP_VERSION="$VERSION" compose up -d --wait --remove-orphans; then
  log "New version failed to become healthy. Recent app logs:"
  compose logs --tail=80 app migrate || true
  die "deploy failed. Roll back with: scripts/rollback.sh ${PREVIOUS:-<version>}"
fi

DOMAIN="$(env_get DOMAIN)"
if command -v curl >/dev/null && [ -n "$DOMAIN" ]; then
  curl -fsS --max-time 15 "https://$DOMAIN/api/health" >/dev/null \
    && log "https://$DOMAIN is healthy." \
    || log "WARNING: https://$DOMAIN/api/health didn't answer (DNS/certificate not ready, or an existing proxy needs configuring)."
fi

printf '%s %s %s\n' "$(date -u +%FT%TZ)" "$VERSION" "$(git log -1 --pretty=%s | head -c 80)" >> .deploy-history
log "Deployed $VERSION (previous: ${PREVIOUS:-none}). Old images are kept for rollback; prune occasionally with: docker image prune"
