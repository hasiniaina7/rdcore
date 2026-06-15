#!/usr/bin/env bash
set -euo pipefail

: "${TARGET_DIR:?Set TARGET_DIR (e.g. /opt/captive-portail)}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_REF="${GIT_REF:-captive-portail}"
TARGET_HOST="${TARGET_HOST:-}"
ENV_FILE="${ENV_FILE:-}"

run_remote() {
  local cmd="$1"
  if [[ -n "$TARGET_HOST" ]]; then
    ssh "$TARGET_HOST" "cd '$TARGET_DIR' && $cmd"
  else
    bash -c "cd '$TARGET_DIR' && $cmd"
  fi
}

run_remote "git fetch '$GIT_REMOTE' '$GIT_REF' && git checkout '$GIT_REF' && git pull '$GIT_REMOTE' '$GIT_REF' && npm install --workspaces && npm --workspace apps/backend-portal-api-rd-omada run build"

if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
  if [[ -n "$TARGET_HOST" ]]; then
    scp "$ENV_FILE" "$TARGET_HOST:$TARGET_DIR/.env"
  else
    cp "$ENV_FILE" "$TARGET_DIR/.env"
  fi
fi

run_remote "pm2 startOrReload deployments/pm2/ecosystem.config.js --only portal-backend"
