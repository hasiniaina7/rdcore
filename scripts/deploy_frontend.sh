#!/usr/bin/env bash
set -euo pipefail

: "${TARGET_DIR:?Set TARGET_DIR to the git checkout (e.g. /opt/captive-portail)}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_REF="${GIT_REF:-captive-portail}"
ENV_FILE="${ENV_FILE:-}"
ASSET_DIR="${ASSET_DIR:-frontend/dist}"

cd "$TARGET_DIR"

echo "[deploy] Syncing git ${GIT_REF}"
git fetch "$GIT_REMOTE" "$GIT_REF"
git checkout "$GIT_REF"
git pull "$GIT_REMOTE" "$GIT_REF"

if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
  cp "$ENV_FILE" frontend/.env
fi

echo "[deploy] Installing deps and building frontend"
npm install --workspaces --omit=dev
npm --workspace frontend run build

if [[ ! -d "$ASSET_DIR" ]]; then
  echo "Build output $ASSET_DIR not found" >&2
  exit 1
fi

echo "[deploy] Reloading PM2 static server"
pm2 startOrReload ecosystem.config.js --only portal-frontend
