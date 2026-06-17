#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   MODE=local ./scripts/deploy_infoconso.sh
#   MODE=remote REMOTE_HOST=ubuntu@host ./scripts/deploy_infoconso.sh
#
# Local mode builds from the checked-out source and syncs dist/ into the local
# portal public directory. Remote mode builds locally and rsyncs dist/ to the
# live portal public directory on the EC2 host. In both cases the portal-frontend
# PM2 process is reloaded after the assets are in place.

FRONT_DIR="${FRONT_DIR:-/home/mastershark-linux/dev/radiusdesk/captive-portail/apps/frontend-infoconso-rd}"
MODE="${MODE:-remote}"
REMOTE_HOST="${REMOTE_HOST:-ubuntu@ec2-13-247-123-11.af-south-1.compute.amazonaws.com}"
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-/home/ubuntu/captive-portail}"
REMOTE_PUBLIC_DIR="${REMOTE_PUBLIC_DIR:-$REMOTE_PROJECT_DIR/public}"
PM2_APP="${PM2_APP:-portal-frontend}"
PM2_ECOSYSTEM="${PM2_ECOSYSTEM:-deployments/pm2/ecosystem.config.js}"
RSYNC_RSH="${RSYNC_RSH:-ssh -i /home/mastershark-linux/ssh/key-not-for-faneva.pem}"
LOCAL_PROJECT_DIR="${LOCAL_PROJECT_DIR:-$REMOTE_PROJECT_DIR}"
LOCAL_PUBLIC_DIR="${LOCAL_PUBLIC_DIR:-$LOCAL_PROJECT_DIR/public}"

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
  ssh -i /home/mastershark-linux/ssh/key-not-for-faneva.pem -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
    "$REMOTE_HOST" "mkdir -p '$REMOTE_PUBLIC_DIR'"
  rsync -az --delete -e "$RSYNC_RSH" \
    "${FRONT_DIR}/dist/" "${REMOTE_HOST}:${REMOTE_PUBLIC_DIR}/"
  ssh -i /home/mastershark-linux/ssh/key-not-for-faneva.pem -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
    "$REMOTE_HOST" "cd '$REMOTE_PROJECT_DIR' && pm2 startOrReload '$PM2_ECOSYSTEM' --only '$PM2_APP'"
else
  mkdir -p "$LOCAL_PUBLIC_DIR"
  rsync -a --delete "${FRONT_DIR}/dist/" "$LOCAL_PUBLIC_DIR/"
  if [[ -d "$LOCAL_PROJECT_DIR" ]]; then
    (
      cd "$LOCAL_PROJECT_DIR"
      pm2 startOrReload "$PM2_ECOSYSTEM" --only "$PM2_APP"
    )
  fi
fi

echo "Deployment complete. Visit https://techzone.lat/infoconso/"
