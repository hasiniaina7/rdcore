#!/usr/bin/env bash
# Migre uniquement la base MariaDB et la configuration FreeRADIUS d'un hôte RadiusDesk.
# Produit un bundle prêt à être transféré sur un nouveau serveur et (optionnellement)
# pousse ce bundle via rsync/scp.

set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/migration_freeradius_mariadb.log"

require_root

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
STAGING_ROOT="${MIGRATION_STAGING_DIR:-/var/backups/radiusdesk-migration}"
WORK_DIR="${STAGING_ROOT}/${TIMESTAMP}"

TARGET_HOST="${MIGRATION_TARGET_HOST:-}"
TARGET_USER="${MIGRATION_TARGET_USER:-root}"
TARGET_PATH="${MIGRATION_TARGET_PATH:-/root}"

mkdir -p "$WORK_DIR"

log INFO "=== Migration FreeRADIUS + MariaDB (${TIMESTAMP}) ==="
log INFO "Répertoire de travail : ${WORK_DIR}"

dump_mariadb() {
  local dump_path="${WORK_DIR}/mariadb_dump.sql"
  local gzip_path="${dump_path}.gz"
  local pass_flag=()

  if [[ -n "${DB_PASS}" ]]; then
    pass_flag=("--password=${DB_PASS}")
  fi

  log INFO "Export de la base ${DB_NAME} (hôte ${DB_HOST}:${DB_PORT})"
  if mysqldump \
      --single-transaction --routines --events \
      -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" "${pass_flag[@]}" \
      "${DB_NAME}" > "${dump_path}"; then
    gzip -f "${dump_path}"
    log INFO "Dump MariaDB compressé : ${gzip_path}"
  else
    log WARN "Dump avec l'utilisateur ${DB_USER} échoué, tentative avec root."
    if mysqldump \
        --single-transaction --routines --events \
        -h "${DB_HOST}" -P "${DB_PORT}" -u root \
        "${DB_NAME}" > "${dump_path}"; then
      gzip -f "${dump_path}"
      log INFO "Dump MariaDB (root) compressé : ${gzip_path}"
    else
      log ERROR "Impossible de générer le dump MariaDB."
      rm -f "${dump_path}"
    fi
  fi
}

export_radacct_csv() {
  local csv_path="${WORK_DIR}/radacct_snapshot.csv"
  log INFO "Export de radacct (CSV simplifié) dans ${csv_path}"
  mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" ${DB_PASS:+--password=${DB_PASS}} "${DB_NAME}" \
    -e "SELECT radacctid, username, nasipaddress, acctstarttime, acctstoptime, acctsessiontime, acctinputoctets, acctoutputoctets FROM radacct" \
    | sed 's/\t/,/g' > "${csv_path}" || log WARN "Export radacct CSV échoué (table volumineuse?)."
}

archive_freeradius() {
  local fr_root="${WORK_DIR}/freeradius"
  mkdir -p "$fr_root"

  log INFO "Copie /etc/freeradius"
  rsync -a /etc/freeradius/ "${fr_root}/etc_freeradius/"

  if [[ -d /var/lib/freeradius ]]; then
    log INFO "Copie /var/lib/freeradius (fichiers dynamiques, clients, certs)"
    rsync -a /var/lib/freeradius/ "${fr_root}/var_lib_freeradius/"
  fi

  if [[ -d /var/log/freeradius ]]; then
    log INFO "Copie /var/log/freeradius"
    rsync -a /var/log/freeradius/ "${fr_root}/var_log_freeradius/"
  fi

  log INFO "Sauvegarde du secret partagé RADIUS (env.sh)"
  printf 'RADIUS_SECRET_DEFAULT="%s"\n' "${RADIUS_SECRET_DEFAULT}" > "${fr_root}/radiusdesk_secrets.env"
}

copy_metadata() {
  log INFO "Ajout d'un fichier README de restauration"
  cat > "${WORK_DIR}/README.txt" <<'EOT'
Bundle de migration FreeRADIUS + MariaDB généré par migrate_freeradius_mariadb.sh
Contenu principal :
  - mariadb_dump.sql.gz : dump complet de la base RadiusDesk
  - radacct_snapshot.csv : export CSV (optionnel) des sessions
  - freeradius/ : configuration FreeRADIUS (/etc, /var/lib, logs)

Import sur un nouveau serveur :
  1) Installer MariaDB et créer la base cible.
  2) gunzip mariadb_dump.sql.gz && mysql -u <user> -p <base> < mariadb_dump.sql
  3) Synchroniser les dossiers freeradius/ selon la hiérarchie :
       rsync -a freeradius/etc_freeradius/ /etc/freeradius/
       rsync -a freeradius/var_lib_freeradius/ /var/lib/freeradius/
  4) Vérifier les droits (chown -R freerad:freerad ...)
  5) Redémarrer mariadb et freeradius.
EOT

  log INFO "Copie de la configuration RadiusDesk env.sh"
  cp "${BASE_DIR}/config/env.sh" "${WORK_DIR}/radiusdesk_env.sh"
}

create_tarball() {
  local tarball="${STAGING_ROOT}/radiusdesk_freeradius_mariadb_${TIMESTAMP}.tar.gz"
  log INFO "Création de l'archive ${tarball}"
  tar -C "${STAGING_ROOT}" -czf "$tarball" "${TIMESTAMP}"
  echo "$tarball"
}

transfer_tarball() {
  local tarball="$1"
  if [[ -n "${TARGET_HOST}" ]]; then
    log INFO "Transfert de ${tarball} vers ${TARGET_USER}@${TARGET_HOST}:${TARGET_PATH}"
    rsync -avz "$tarball" "${TARGET_USER}@${TARGET_HOST}:${TARGET_PATH}" || log WARN "Transfert rsync échoué."
  else
    log INFO "Aucune cible distante définie (MIGRATION_TARGET_HOST). Tarball conservé localement."
  fi
}

dump_mariadb
export_radacct_csv || true
archive_freeradius
copy_metadata
TARBALL_PATH="$(create_tarball)"
transfer_tarball "$TARBALL_PATH"

log INFO "Migration générée : ${TARBALL_PATH}"
log INFO "=== Fin migration FreeRADIUS + MariaDB (${TIMESTAMP}) ==="
