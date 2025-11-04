#!/usr/bin/env bash
# Script de migration / mise à jour incrémentale de RADIUSdesk
# - Sauvegarde la base
# - Met à jour les dépôts git
# - Relance Composer & applique les patchs SQL
# - Nettoie le cache CakePHP
# - Reconstruit l'UI (Sencha) si l'outil est disponible

set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/migration_radiusdesk.log"

require_root

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${MIGRATION_BACKUP_DIR:-/var/backups/radiusdesk}"
SENCHA_BIN="${SENCHA_BIN:-$(command -v sencha || true)}"

log INFO "=== Démarrage de la migration RADIUSdesk (${TIMESTAMP}) ==="

mkdir -p "${BACKUP_DIR}"

dump_database() {
  local dump_file="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
  log INFO "Sauvegarde de la base ${DB_NAME} vers ${dump_file}"

  local pass_flag=()
  if [[ -n "${DB_PASS}" ]]; then
    pass_flag=("--password=${DB_PASS}")
  fi

  if mysqldump --single-transaction --routines --events -u "${DB_USER}" "${pass_flag[@]}" "${DB_NAME}" | gzip > "${dump_file}"; then
    log INFO "Dump MySQL complété."
  else
    log WARN "Échec du dump avec l'utilisateur ${DB_USER}, tentative avec root."
    if mysqldump --single-transaction --routines --events -u root "${DB_NAME}" | gzip > "${dump_file}"; then
      log INFO "Dump MySQL réalisé via root."
    else
      log WARN "Impossible de sauvegarder la base. Poursuite de la migration sans dump."
      rm -f "${dump_file}"
    fi
  fi
}

update_git_repo() {
  local path="$1"
  local url="$2"

  git config --global --add safe.directory "$path" || true

  if [[ ! -d "$path/.git" ]]; then
    log INFO "Clonage de ${url} dans ${path}"
    git clone "$url" "$path"
  else
    log INFO "Mise à jour git dans ${path}"
    if ! git -C "$path" fetch --all --prune; then
      log WARN "git fetch échoué dans ${path}"
    else
      git -C "$path" reset --hard origin/$(git -C "$path" rev-parse --abbrev-ref HEAD || echo master) || true
      git -C "$path" pull --ff-only || log WARN "git pull échoué dans ${path}"
    fi
  fi
}

run_composer() {
  local workdir="/var/www/rdcore/cake4/rd_cake"
  if [[ -f "${workdir}/composer.json" ]]; then
    log INFO "composer install (production)"
    sudo -H -u www-data composer install --no-dev --prefer-dist --no-interaction --working-dir="$workdir"
  else
    log WARN "composer.json introuvable dans ${workdir}, saut."
  fi
}

apply_sql_patches() {
  local patch_dir="/var/www/rdcore/cake4/rd_cake/setup/db"
  local state_dir="${STATE_DIR}/sql_patches"
  mkdir -p "$state_dir"

  if compgen -G "${patch_dir}/8.*.sql" >/dev/null; then
    while IFS= read -r patch; do
      local name="$(basename "$patch")"
      local marker="${state_dir}/${name}.done"
      if [[ -f "$marker" ]]; then
        log INFO "Patch ${name} déjà appliqué."
        continue
      fi
      log INFO "Application du patch ${name}"
      if mysql --force -u root "${DB_NAME}" < "$patch"; then
        log INFO "Patch ${name} appliqué."
      else
        log WARN "Patch ${name} : vérifier manuellement les messages MySQL."
      fi
      touch "$marker"
    done < <(find "$patch_dir" -maxdepth 1 -type f -name '8.*.sql' -print | sort)
  else
    log INFO "Aucun patch SQL 8.*.sql trouvé."
  fi
}

clear_cake_cache() {
  local cake_bin="/var/www/rdcore/cake4/rd_cake/bin/cake"
  if [[ -x "$cake_bin" ]]; then
    log INFO "Nettoyage des caches CakePHP"
    sudo -H -u www-data "$cake_bin" cache clear_all || log WARN "Échec nettoyage cache CakePHP"
  else
    log WARN "Commande Cake introuvable (${cake_bin})"
  fi
}

build_sencha() {
  local app_dir="/var/www/rdcore/rd"
  if [[ -n "$SENCHA_BIN" && -x "$SENCHA_BIN" ]]; then
    log INFO "Reconstruction Sencha (production)"
    pushd "$app_dir" >/dev/null
    if OPENSSL_CONF=/etc/ssl/openssl-phantom.cnf timeout 1800 "$SENCHA_BIN" app build production; then
      log INFO "Build Sencha terminé."
    else
      log WARN "Échec du build Sencha, vérifier les logs."
    fi
    popd >/dev/null
  else
    log WARN "Sencha Cmd non trouvé (SENCHA_BIN). Build UI non exécuté."
  fi
}

refresh_permissions() {
  log INFO "Remise en place des permissions www-data"
  chown -R www-data:www-data /var/www/rdcore || true
  chown -R www-data:www-data /var/www/html  || true
}

reload_services() {
  local php_version
  php_version="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null || true)"
  local php_service=""
  if [[ -n "$php_version" ]]; then
    php_service="php${php_version}-fpm"
  fi

  if [[ -n "$php_service" ]]; then
    systemctl reload "$php_service" || log WARN "Reload ${php_service} échoué"
  else
    systemctl reload php-fpm || true
  fi

  systemctl reload nginx || true
}

dump_database
update_git_repo /var/www/rdcore https://github.com/RADIUSdesk/rdcore.git
if [[ -d /var/www/rd_mobile || "${INSTALL_RD_MOBILE:-1}" -eq 1 ]]; then
  update_git_repo /var/www/rd_mobile https://github.com/RADIUSdesk/rd_mobile.git || true
fi

run_composer
apply_sql_patches
clear_cake_cache
build_sencha
refresh_permissions
reload_services

log INFO "=== Migration RADIUSdesk terminée (${TIMESTAMP}) ==="
