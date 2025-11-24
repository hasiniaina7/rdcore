#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   FRONT_DIR=/home/ubuntu/captive-portail/frontend \
#   TARGET_DIR=/var/www/infoconso \
#   sudo ./scripts/deploy_infoconso.sh
#
# Defaults match the production server layout.

FRONT_DIR="${FRONT_DIR:-/home/ubuntu/captive-portail/frontend}"
TARGET_DIR="${TARGET_DIR:-/var/www/infoconso}"
NGINX_SERVICE="${NGINX_SERVICE:-nginx}"

echo "==> Building frontend from ${FRONT_DIR}"
pushd "$FRONT_DIR" >/dev/null
npm install
VITE_APP_BASENAME="${VITE_APP_BASENAME:-/infoconso}" \
VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}" \
  npm run build
popd >/dev/null

echo "==> Syncing dist/ to ${TARGET_DIR}"
sudo rm -rf "$TARGET_DIR"
sudo mkdir -p "$TARGET_DIR"
sudo rsync -a "${FRONT_DIR}/dist/" "$TARGET_DIR/"
sudo chown -R www-data:www-data "$TARGET_DIR"
sudo find "$TARGET_DIR" -type d -exec chmod 755 {} +

echo "==> Reloading ${NGINX_SERVICE}"
sudo systemctl reload "$NGINX_SERVICE"

echo "Deployment complete. Visit https://hotspot.techzone.lat/infoconso/"
