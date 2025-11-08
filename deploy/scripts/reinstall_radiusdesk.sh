#!/usr/bin/env bash
# Réinstallation complète de RADIUSdesk (hors FreeRADIUS)
# - Sauvegarde les assets uploadés (logos, photos, etc.) dans un répertoire persistant
# - Supprime l'installation existante (rdcore, rd_mobile, liens html)
# - Relance l'étape 40 d'installation applicative
# - Recrée les liens symboliques vers les assets persistants

set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/reinstall_radiusdesk.log"

require_root

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
RDCORE_PATH="/var/www/rdcore"
RDMOBILE_PATH="/var/www/rd_mobile"
WEBROOT_PATH="/var/www/html"
BACKUP_ROOT="${MIGRATION_BACKUP_DIR:-/var/backups/radiusdesk-migration}"
REINSTALL_BACKUP_DIR="${BACKUP_ROOT}/reinstall_${TIMESTAMP}"
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

log INFO "=== Réinstallation RADIUSdesk (${TIMESTAMP}) ==="

backup_upload_assets() {
  mkdir -p "${UPLOADS_PERSIST_ROOT}"
  if [[ ! -d "${RDCORE_PATH}" ]]; then
    log WARN "Répertoire ${RDCORE_PATH} absent, aucun asset à sauvegarder."
    return
  fi

  for rel in "${UPLOAD_RELATIVE_PATHS[@]}"; do
    local src="${RDCORE_PATH}/${rel}"
    local dest="${UPLOADS_PERSIST_ROOT}/${rel}"
    if [[ -d "${src}" ]]; then
      mkdir -p "${dest}"
      rsync -a "${src}/" "${dest}/" || log WARN "Rsync partielle pour ${src}"
    fi
  done
}

backup_code() {
  mkdir -p "${REINSTALL_BACKUP_DIR}"
  if [[ -d "${RDCORE_PATH}" ]]; then
    log INFO "Archive de l'ancien rdcore dans ${REINSTALL_BACKUP_DIR}/rdcore.tar.gz"
    tar -czf "${REINSTALL_BACKUP_DIR}/rdcore.tar.gz" -C /var/www rdcore || log WARN "Archive rdcore échouée"
  fi
  if [[ -d "${RDMOBILE_PATH}" ]]; then
    log INFO "Archive de l'ancien rd_mobile dans ${REINSTALL_BACKUP_DIR}/rd_mobile.tar.gz"
    tar -czf "${REINSTALL_BACKUP_DIR}/rd_mobile.tar.gz" -C /var/www rd_mobile || log WARN "Archive rd_mobile échouée"
  fi
}

purge_previous_install() {
  log INFO "Suppression des répertoires applicatifs existants."
  rm -rf "${RDCORE_PATH}" "${RDMOBILE_PATH}"
  rm -rf "${WEBROOT_PATH}/rd" "${WEBROOT_PATH}/cake4" "${WEBROOT_PATH}/login" "${WEBROOT_PATH}/rd_mobile" \
         "${WEBROOT_PATH}/conf_dev" "${WEBROOT_PATH}/reporting"
  rm -f  "${STATE_DIR}/40_radiusdesk_app.done"
}

run_reinstall() {
  log INFO "Relance de l'étape 40 (radiusdesk_app)."
  "${BASE_DIR}/run-phase.sh" 40
}

restore_persistent_assets() {
  for rel in "${UPLOAD_RELATIVE_PATHS[@]}"; do
    local src="${RDCORE_PATH}/${rel}"
    local dest="${UPLOADS_PERSIST_ROOT}/${rel}"
    mkdir -p "${dest}"
    if [[ -d "${src}" && ! -L "${src}" ]]; then
      # Si aucune sauvegarde n'existait, on seed le répertoire persistant
      if [[ -z "$(ls -A "${dest}" 2>/dev/null)" ]]; then
        rsync -a "${src}/" "${dest}/" || true
      fi
      rm -rf "${src}"
    elif [[ -L "${src}" ]]; then
      rm -f "${src}"
    fi
    mkdir -p "$(dirname "${src}")"
    ln -sfn "${dest}" "${src}"
    chown -R www-data:www-data "${dest}" || true
  done
}

reload_services() {
  local php_version
  php_version="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null || true)"
  if [[ -n "${php_version}" ]]; then
    systemctl reload "php${php_version}-fpm" || true
  else
    systemctl reload php-fpm || true
  fi
  systemctl reload nginx || true
}

backup_upload_assets
backup_code
purge_previous_install
run_reinstall
restore_persistent_assets
reload_services

log INFO "=== Réinstallation RADIUSdesk terminée (${TIMESTAMP}) ==="
