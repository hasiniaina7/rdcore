#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

LOG_DIR="/var/log/radiusdesk-install"
STATE_DIR="/var/local/radiusdesk-install"

mkdir -p "$LOG_DIR" "$STATE_DIR"

log() {
  local level="$1"; shift
  echo "[$(date -Is)] [$level] $*" | tee -a "${CURRENT_LOG:-/dev/null}"
}

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "Ce script doit être exécuté en root." >&2
    exit 1
  fi
}

already_done() {
  local name="$1"
  [[ -f "$STATE_DIR/${name}.done" ]]
}

mark_done() {
  local name="$1"
  touch "$STATE_DIR/${name}.done"
}
