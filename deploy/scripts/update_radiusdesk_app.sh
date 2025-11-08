#!/usr/bin/env bash
# Met à jour le code RADIUSdesk (git pull + composer) et applique les patches SQL 8.*.
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/update_radiusdesk_app.log"
AUTO_CLOSE_STALE_SESSIONS="${AUTO_CLOSE_STALE_SESSIONS:-1}"
STALE_SESSION_GRACE_SECONDS="${STALE_SESSION_GRACE_SECONDS:-900}"
PATCHES_DIR="${BASE_DIR}/templates/patches"

require_root

RDCORE_PATH="${RDCORE_PATH:-/var/www/rdcore}"
RDMOBILE_PATH="${RDMOBILE_PATH:-/var/www/rd_mobile}"
RD_BRANCH="${RD_BRANCH:-cake4}"
PATCH_DIR="${RDCORE_PATH}/cake4/rd_cake/setup/db"
PATCH_STATE_DIR="${STATE_DIR}/sql_patches"
WWW_USER="${WWW_USER:-www-data}"
WWW_GROUP="${WWW_GROUP:-www-data}"

log INFO "=== Mise à jour RadiusDesk (code + patches SQL) ==="

MANAGED_BUILD_DIR="${RDCORE_PATH}/rd/build/production/Rd"
BACKUP_ROOT="${BASE_DIR}/backups/rd_build"
MAX_BUILD_BACKUPS=2

rotate_build_backups() {
  mkdir -p "${BACKUP_ROOT}"
  if [[ -d "${MANAGED_BUILD_DIR}" ]]; then
    local ts
    ts="$(date +%Y%m%d-%H%M%S)"
    local dest="${BACKUP_ROOT}/Rd_backup_${ts}"
    log INFO "Sauvegarde du build courant dans ${dest}."
    cp -a "${MANAGED_BUILD_DIR}" "${dest}"
  else
    log INFO "Pas de build actuel à sauvegarder (${MANAGED_BUILD_DIR} introuvable)."
  fi

  mapfile -t backups < <(ls -1dt ${BACKUP_ROOT}/Rd_backup_* 2>/dev/null || true)
  local count="${#backups[@]}"
  if (( count > MAX_BUILD_BACKUPS )); then
    for ((i=MAX_BUILD_BACKUPS; i<count; i++)); do
      log INFO "Suppression de l'ancienne sauvegarde ${backups[i]}"
      rm -rf "${backups[i]}"
    done
  fi
}

purge_old_build() {
  if [[ -d "${MANAGED_BUILD_DIR}" ]]; then
    log INFO "Suppression de l'ancien build ${MANAGED_BUILD_DIR}."
    rm -rf "${MANAGED_BUILD_DIR}"
  fi
}

apply_local_patches() {
  if compgen -G "${PATCHES_DIR}/*.patch" >/dev/null 2>&1; then
    for patch_file in "${PATCHES_DIR}"/*.patch; do
      log INFO "Application du patch local $(basename "${patch_file}")."
      if patch -d "${RDCORE_PATH}" -p1 -N --dry-run < "${patch_file}" >/dev/null 2>&1; then
        patch -d "${RDCORE_PATH}" -p1 -N < "${patch_file}" || log WARN "Échec application patch $(basename "${patch_file}")."
      else
        log INFO "Patch $(basename "${patch_file}") déjà appliqué ou non applicable (dry-run)."
      fi
    done
  fi
}

ensure_git_repo() {
  local path="$1"
  if [[ ! -d "${path}/.git" ]]; then
    log ERROR "Le dépôt git ${path} est introuvable."
    exit 1
  fi
  git config --global --add safe.directory "${path}" || true
}

update_repo() {
  local path="$1"
  local branch="$2"
  ensure_git_repo "${path}"
  log INFO "Mise à jour git ${path} (branche ${branch})."
  git -C "${path}" fetch origin "${branch}" || log WARN "git fetch ${path} a échoué."
  if git -C "${path}" rev-parse --verify "${branch}" >/dev/null 2>&1; then
    git -C "${path}" checkout "${branch}" || log WARN "git checkout ${branch} a échoué."
  fi
  git -C "${path}" pull --ff-only origin "${branch}" || log WARN "git pull ${path} a échoué (merge manuel requis ?)."
}

if [[ -d "${RDCORE_PATH}" ]]; then
  update_repo "${RDCORE_PATH}" "${RD_BRANCH}"
else
  log ERROR "RDCORE_PATH=${RDCORE_PATH} introuvable."
  exit 1
fi

if [[ -d "${RDMOBILE_PATH}" ]]; then
  update_repo "${RDMOBILE_PATH}" master || true
fi

rotate_build_backups
purge_old_build

log INFO "Installation/maj des dépendances Composer."
if [[ -f "${RDCORE_PATH}/cake4/rd_cake/composer.json" ]]; then
  chown -R "${WWW_USER}:${WWW_GROUP}" "${RDCORE_PATH}"
  sudo -H -u "${WWW_USER}" composer install --no-dev --prefer-dist --no-interaction --working-dir="${RDCORE_PATH}/cake4/rd_cake" || {
    log ERROR "composer install a échoué."
    exit 1
  }
else
  log WARN "composer.json introuvable dans ${RDCORE_PATH}/cake4/rd_cake."
fi

apply_local_patches

log INFO "Application des patches SQL 8.* (si nécessaires)."
mkdir -p "${PATCH_STATE_DIR}"
if compgen -G "${PATCH_DIR}/8.*.sql" >/dev/null; then
  while IFS= read -r patch; do
    patch_name="$(basename "${patch}")"
    marker="${PATCH_STATE_DIR}/${patch_name}.done"
    if [[ -f "${marker}" ]]; then
      log INFO "Patch SQL ${patch_name} déjà appliqué."
      continue
    fi
    log INFO "Application du patch SQL ${patch_name}."
    if mysql --force -u root "${DB_NAME}" < "${patch}"; then
      log INFO "Patch ${patch_name} appliqué."
      touch "${marker}"
    else
      log WARN "Patch ${patch_name} a retourné des avertissements (déjà appliqué ?)."
      touch "${marker}"
    fi
  done < <(find "${PATCH_DIR}" -maxdepth 1 -type f -name '8.*.sql' -print | sort)
else
  log INFO "Aucun patch 8.*.sql trouvé dans ${PATCH_DIR}."
fi

log INFO "Purge du cache CakePHP (models/persistent)."
rm -f "${RDCORE_PATH}/cake4/rd_cake/tmp/cache/models/"* || true
rm -f "${RDCORE_PATH}/cake4/rd_cake/tmp/cache/persistent/"* || true

if [[ "${AUTO_CLOSE_STALE_SESSIONS}" -eq 1 ]]; then
  if [[ -x "${BASE_DIR}/scripts/cleanup_stale_radacct.sh" ]]; then
    log INFO "Fermeture automatique des sessions radacct orphelines (mise à jour)."
    STALE_SESSION_GRACE_SECONDS="${STALE_SESSION_GRACE_SECONDS}" "${BASE_DIR}/scripts/cleanup_stale_radacct.sh" || log WARN "Nettoyage radacct a signalé une erreur."
  fi
fi

log INFO "=== Mise à jour RadiusDesk terminée ==="
