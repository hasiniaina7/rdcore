#!/usr/bin/env bash
# Force la persistance et les permissions correctes des uploads (logos, photos, etc.)

set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "${BASE_DIR}/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/fix_radiusdesk_logos.log"

require_root

RDCORE_PATH="/var/www/rdcore"
UPLOADS_PERSIST_ROOT="${RD_UPLOADS_PERSIST_DIR:-/var/local/radiusdesk-data/uploads}"

UPLOAD_RELATIVE_PATHS=(
  "cake4/rd_cake/webroot/img/access_providers"
  "cake4/rd_cake/webroot/img/dynamic_details"
  "cake4/rd_cake/webroot/img/dynamic_photos"
  "cake4/rd_cake/webroot/img/realms"
  "cake4/rd_cake/webroot/img/hardwares"
  "cake4/rd_cake/webroot/img/mobile_providers"
  "cake4/rd_cake/webroot/img/nas"
  "cake4/rd_cake/webroot/img/wallpapers"
  "cake4/rd_cake/webroot/files/imagecache"
)

if [[ ! -d "${RDCORE_PATH}" ]]; then
  log WARN "Répertoire ${RDCORE_PATH} introuvable."
  exit 1
fi

mkdir -p "${UPLOADS_PERSIST_ROOT}"

for rel in "${UPLOAD_RELATIVE_PATHS[@]}"; do
  src="${RDCORE_PATH}/${rel}"
  dest="${UPLOADS_PERSIST_ROOT}/${rel}"

  mkdir -p "${dest}"
  if [[ -d "${src}" && ! -L "${src}" ]]; then
    log INFO "Synchronisation initiale ${src} -> ${dest}"
    rsync -a "${src}/" "${dest}/" || log WARN "Rsync partielle pour ${src}"
    rm -rf "${src}"
  elif [[ -L "${src}" ]]; then
    rm -f "${src}"
  fi

  mkdir -p "$(dirname "${src}")"
  ln -sfn "${dest}" "${src}"
  chown -R www-data:www-data "${dest}" || true
  chmod 775 "${dest}" || true
done

DEFAULT_LOGO_SRC="${DEFAULT_LOGO_FILE:-${REPO_ROOT}/logo.png}"
DEFAULT_LOGO_DEST="${UPLOADS_PERSIST_ROOT}/cake4/rd_cake/webroot/img/access_providers/logo.png"
if [[ -f "${DEFAULT_LOGO_SRC}" ]]; then
  if [[ ! -f "${DEFAULT_LOGO_DEST}" ]] || ! cmp -s "${DEFAULT_LOGO_SRC}" "${DEFAULT_LOGO_DEST}"; then
    log INFO "Copie du logo par défaut vers ${DEFAULT_LOGO_DEST}"
    install -m 0644 "${DEFAULT_LOGO_SRC}" "${DEFAULT_LOGO_DEST}"
    chown www-data:www-data "${DEFAULT_LOGO_DEST}" || true
  fi
else
  log WARN "Logo par défaut introuvable (${DEFAULT_LOGO_SRC}), copie ignorée."
fi

log INFO "Symlinks et permissions des logos/uploads rétablis."
