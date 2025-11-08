#!/usr/bin/env bash
# Répare le module /OTHER en restaurant une build Sencha saine.
# - Source par défaut : dernier snapshot du dossier deploy/backups/rd_build
# - Peut aussi accepter un tarball (.tar.gz) via UI_FIX_SOURCE

set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/fix_radiusdesk_other.log"

require_root

TARGET_DIR="/var/www/rdcore/rd/build/production/Rd"
BACKUP_DIR_DEFAULT="${RD_UI_BACKUP_DIR:-${BASE_DIR}/backups/rd_build}"
UI_FIX_SOURCE="${UI_FIX_SOURCE:-}"

tmp_dir=""

cleanup() {
  if [[ -n "${tmp_dir}" && -d "${tmp_dir}" ]]; then
    rm -rf "${tmp_dir}"
  fi
}
trap cleanup EXIT

select_source_dir() {
  if [[ -n "${UI_FIX_SOURCE}" ]]; then
    if [[ -f "${UI_FIX_SOURCE}" && "${UI_FIX_SOURCE}" =~ \.tar\.gz$ ]]; then
      tmp_dir="$(mktemp -d /tmp/rd_ui_fix.XXXXXX)"
      log INFO "Extraction de ${UI_FIX_SOURCE} vers ${tmp_dir}"
      tar -xzf "${UI_FIX_SOURCE}" -C "${tmp_dir}"
      echo "${tmp_dir}"
      return
    elif [[ -d "${UI_FIX_SOURCE}" ]]; then
      echo "${UI_FIX_SOURCE}"
      return
    else
      log WARN "UI_FIX_SOURCE ${UI_FIX_SOURCE} invalide. Utilisation du dernier backup local."
    fi
  fi

  if [[ ! -d "${BACKUP_DIR_DEFAULT}" ]]; then
    log WARN "Aucun backup UI trouvé (${BACKUP_DIR_DEFAULT})."
    exit 1
  fi

  local latest
  latest="$(ls -1dt "${BACKUP_DIR_DEFAULT}"/Rd_backup_* 2>/dev/null | head -n1 || true)"
  if [[ -z "${latest}" ]]; then
    log WARN "Pas de dossier Rd_backup_* dans ${BACKUP_DIR_DEFAULT}."
    exit 1
  fi
  echo "${latest}"
}

deploy_ui_from_source() {
  local src="$1"
  local src_payload="${src}"

  if [[ -d "${src}/Rd" ]]; then
    src_payload="${src}/Rd"
  fi

  if [[ ! -f "${src_payload}/index.html" ]]; then
    log WARN "Le dossier ${src_payload} ne semble pas contenir une build Sencha valide."
    exit 1
  fi

  mkdir -p "${TARGET_DIR}"
  log INFO "Restauration de la build UI depuis ${src_payload} vers ${TARGET_DIR}"
  rsync -a --delete "${src_payload}/" "${TARGET_DIR}/"
}

purge_ui_caches() {
  log INFO "Purge du cache appcache/manifest."
  rm -f "${TARGET_DIR}/cache.appcache" || true
  find "${TARGET_DIR}" -maxdepth 2 -name "app.json" -exec touch {} \; || true
}

reload_services() {
  local php_version
  php_version="$(php -r 'echo PHP_MAJOR_VERSION.\".\".PHP_MINOR_VERSION;' 2>/dev/null || true)"
  if [[ -n "${php_version}" ]]; then
    systemctl reload "php${php_version}-fpm" || true
  else
    systemctl reload php-fpm || true
  fi
  systemctl reload nginx || true
}

SOURCE_DIR="$(select_source_dir)"
deploy_ui_from_source "${SOURCE_DIR}"
purge_ui_caches
reload_services

log INFO "Module /OTHER rafraîchi avec succès."
