#!/usr/bin/env bash
# Switch the app back to a previously deployed version (image must still exist locally).
#
#   scripts/rollback.sh               # list recent deploys
#   scripts/rollback.sh <version>     # roll back the app to <version>
#
# Database migrations are NOT reversed. Migrations are written to be backward compatible
# (expand first, remove later), so an older app runs on a newer schema. If a release ever breaks
# that rule, restore the pre-deploy backup instead: scripts/restore.sh (see docs/DEPLOYMENT.md).
. "$(dirname "$0")/lib.sh"

if [ $# -eq 0 ]; then
  log "Recent deploys (newest last):"
  tail -n 10 .deploy-history 2>/dev/null || echo "(no history yet)"
  log "Current: $(env_get APP_VERSION)"
  exit 0
fi

TARGET="$1"
docker image inspect "guitar-dojo-app:$TARGET" >/dev/null 2>&1 || die "image guitar-dojo-app:$TARGET not found locally (rebuild it: git checkout $TARGET && scripts/deploy.sh)"

log "Rolling back app to $TARGET…"
env_set APP_VERSION "$TARGET"
APP_VERSION="$TARGET" compose up -d --wait --no-build app
printf '%s %s %s\n' "$(date -u +%FT%TZ)" "$TARGET" "ROLLBACK" >> .deploy-history
log "Now running $TARGET."
