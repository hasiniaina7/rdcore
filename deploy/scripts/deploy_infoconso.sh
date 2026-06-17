#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   MODE=local ./scripts/deploy_infoconso.sh
#   MODE=remote REMOTE_HOST=ubuntu@host ./scripts/deploy_infoconso.sh
#
# Local mode builds from the checked-out source and syncs dist/ into TARGET_DIR.
# Remote mode builds locally and rsyncs dist/ to REMOTE_HOST:REMOTE_TARGET.
# In both cases the web root is updated through a staging directory and an
# atomic directory swap to avoid disrupting in-flight requests.

FRONT_DIR="${FRONT_DIR:-/home/mastershark-linux/dev/radiusdesk/captive-portail/apps/frontend-infoconso-rd}"
TARGET_DIR="${TARGET_DIR:-/var/www/infoconso}"
NGINX_SERVICE="${NGINX_SERVICE:-nginx}"
MODE="${MODE:-local}"
REMOTE_HOST="${REMOTE_HOST:-ubuntu@ec2-13-247-123-11.af-south-1.compute.amazonaws.com}"
REMOTE_TARGET="${REMOTE_TARGET:-$TARGET_DIR}"
RSYNC_RSH="${RSYNC_RSH:-ssh -i /home/mastershark-linux/ssh/key-not-for-faneva.pem}"

if [[ ! -d "$FRONT_DIR" ]]; then
  echo "ERROR: FRONT_DIR does not exist: $FRONT_DIR" >&2
  exit 1
fi

echo "==> Building frontend from ${FRONT_DIR}"
pushd "$FRONT_DIR" >/dev/null
npm install
VITE_APP_BASENAME="${VITE_APP_BASENAME:-/infoconso}" \
VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}" \
  npm run build
popd >/dev/null

if [[ ! -d "${FRONT_DIR}/dist" ]]; then
  echo "ERROR: build output missing: ${FRONT_DIR}/dist" >&2
  exit 1
fi

echo "==> Syncing dist/ via rsync (${MODE})"
if [[ "$MODE" == "remote" ]]; then
  rsync -az --delete -e "$RSYNC_RSH" \
    "${FRONT_DIR}/dist/" "${REMOTE_HOST}:${REMOTE_TARGET}/"
else
  LIVE_DIR="$TARGET_DIR"
  STAGING_DIR="${TARGET_DIR}.staging.$$"
  PREV_DIR="${TARGET_DIR}.prev.$$"

  sudo mkdir -p "$STAGING_DIR"
  sudo rsync -a --delete "${FRONT_DIR}/dist/" "$STAGING_DIR/"
  sudo chown -R www-data:www-data "$STAGING_DIR"
  sudo find "$STAGING_DIR" -type d -exec chmod 755 {} +

  if [[ -d "$LIVE_DIR" ]]; then
    sudo mv "$LIVE_DIR" "$PREV_DIR"
  fi
  sudo mv "$STAGING_DIR" "$LIVE_DIR"
  if [[ -d "$PREV_DIR" ]]; then
    sudo rm -rf "$PREV_DIR"
  fi
fi

echo "==> Reloading ${NGINX_SERVICE}"
sudo systemctl reload "$NGINX_SERVICE"

echo "Deployment complete. Visit https://hotspot.techzone.lat/infoconso/"
