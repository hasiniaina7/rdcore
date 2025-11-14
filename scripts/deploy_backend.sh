#!/usr/bin/env bash
set -euo pipefail

: "${TARGET_DIR:?Set TARGET_DIR to the git checkout (e.g. /opt/captive-portail)}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_REF="${GIT_REF:-captive-portail}"
ENV_FILE="${ENV_FILE:-}" # path to a .env file to copy into backend/.env

cd "$TARGET_DIR"

echo "[deploy] Fetching ${GIT_REMOTE}/${GIT_REF}"
git fetch "$GIT_REMOTE" "$GIT_REF"
git checkout "$GIT_REF"
git pull "$GIT_REMOTE" "$GIT_REF"

echo "[deploy] Installing dependencies (workspace-aware)"
npm install --workspaces --omit=dev

echo "[deploy] Building backend"
npm --workspace backend run build

if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
  cp "$ENV_FILE" backend/.env
fi

echo "[deploy] Reloading PM2 process"
pm2 startOrReload ecosystem.config.js --only portal-backend
