#!/usr/bin/env bash
# Shared helpers for the deployment scripts. Sourced, not executed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Compose files: set COMPOSE_FILES="compose.yaml compose.existing-proxy.yaml" in the environment
# (or in .deploy.conf) when using an existing reverse proxy.
[ -f .deploy.conf ] && . ./.deploy.conf
COMPOSE_FILES="${COMPOSE_FILES:-compose.yaml}"

compose() {
  local args=()
  for f in $COMPOSE_FILES; do args+=(-f "$f"); done
  docker compose "${args[@]}" "$@"
}

# Read one value from .env without executing it (values may contain shell metacharacters).
env_get() {
  local line
  line="$(grep -E "^$1=" .env | tail -n 1 || true)"
  line="${line#*=}"
  line="${line%\"}"; line="${line#\"}"
  printf '%s' "$line"
}

# Replace (or append) KEY=value in .env.
env_set() {
  if grep -qE "^$1=" .env; then
    sed -i "s|^$1=.*|$1=$2|" .env
  else
    printf '%s=%s\n' "$1" "$2" >> .env
  fi
}

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }

[ -f .env ] || die ".env not found in $ROOT (copy .env.example and fill it in)"
