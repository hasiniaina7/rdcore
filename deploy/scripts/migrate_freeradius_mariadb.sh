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

mysql_query_any() {
  local query="$1"
  local opts=(-N -B)
  local pass_flag=()
  local output

  if [[ -n "${DB_PASS}" ]]; then
    pass_flag=("--password=${DB_PASS}")
  fi

  if output=$(mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" "${pass_flag[@]}" -D "${DB_NAME}" "${opts[@]}" -e "${query}" 2>/dev/null); then
    printf '%s\n' "${output}"
    return 0
  fi

  if output=$(mysql -u root -D "${DB_NAME}" "${opts[@]}" -e "${query}" 2>/dev/null); then
    printf '%s\n' "${output}"
    return 0
  fi

  if output=$(mysql -h "${DB_HOST}" -P "${DB_PORT}" -u root -D "${DB_NAME}" "${opts[@]}" -e "${query}" 2>/dev/null); then
    printf '%s\n' "${output}"
    return 0
  fi

  return 1
}

test_db_user_access() {
  local pass_flag=()
  local err_file
  err_file="$(mktemp)"

  if [[ -n "${DB_PASS}" ]]; then
    pass_flag=("--password=${DB_PASS}")
  fi

  if mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" "${pass_flag[@]}" -D "${DB_NAME}" -e "SELECT 1" >/dev/null 2>"${err_file}"; then
    log INFO "Connexion MariaDB avec ${DB_USER}@${DB_HOST}:${DB_PORT} validée."
  else
    local err_msg=""
    if [[ -s "${err_file}" ]]; then
      err_msg="$(head -n 1 "${err_file}")"
    fi
    log WARN "Connexion MariaDB avec ${DB_USER}@${DB_HOST}:${DB_PORT} impossible. Vérifiez les privilèges. Détails: ${err_msg:-\"aucune sortie\"}"
  fi
  rm -f "${err_file}"
}

dump_mariadb() {
  local dump_path="${WORK_DIR}/mariadb_dump.sql"
  local gzip_path="${dump_path}.gz"
  local dump_err="${dump_path}.stderr"
  local pass_flag=()

  if [[ -n "${DB_PASS}" ]]; then
    pass_flag=("--password=${DB_PASS}")
  fi

  mkdir -p "${WORK_DIR}"
  chmod 750 "${WORK_DIR}"

  log INFO "Export de la base ${DB_NAME} (hôte ${DB_HOST}:${DB_PORT})"
  test_db_user_access

  perform_dump() {
    local label="$1"; shift
    if mysqldump \
        --single-transaction --routines --events \
        "$@" > "${dump_path}" 2> "${dump_err}"; then
      gzip -f "${dump_path}"
      rm -f "${dump_err}"
      log INFO "Dump MariaDB ${label} compressé : ${gzip_path}"
      return 0
    fi
    local exit_code=$?
    local err_msg=""
    if [[ -s "${dump_err}" ]]; then
      err_msg="$(head -n 2 "${dump_err}" | tr $'\n' ' ')"
    fi
    log WARN "mysqldump ${label} échoué (code ${exit_code}). ${err_msg:-\"sans sortie stderr\"}"
    rm -f "${dump_path}" "${gzip_path}"
    return 1
  }

  # 1) Tentative avec l'utilisateur applicatif via TCP
  if perform_dump "${DB_USER}@${DB_HOST}:${DB_PORT}" \
      -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" "${pass_flag[@]}" \
      "${DB_NAME}"; then
    return 0
  fi

  # 2) Fallback root via socket (évite les échecs root TCP avec unix_socket)
  log WARN "Dump avec l'utilisateur ${DB_USER} échoué, tentative avec root via socket."
  if perform_dump "root@localhost (socket)" \
      -u root "${DB_NAME}"; then
    return 0
  fi

  # 3) Dernière tentative root TCP (si unix_socket non actif)
  log WARN "Tentative finale root via TCP ${DB_HOST}:${DB_PORT}."
  if perform_dump "root@${DB_HOST}:${DB_PORT}" \
      -h "${DB_HOST}" -P "${DB_PORT}" -u root \
      "${DB_NAME}"; then
    return 0
  fi

  log ERROR "Impossible de générer le dump MariaDB. Vérifiez les privilèges ou l'authentification root (unix_socket)."
  rm -f "${dump_path}"
  rm -f "${dump_err}"
  return 1
}

export_radacct_csv() {
  local csv_path="${WORK_DIR}/radacct_snapshot.csv"
  log INFO "Export de radacct (CSV simplifié) dans ${csv_path}"
  if mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" ${DB_PASS:+--password=${DB_PASS}} -D "${DB_NAME}" \
      -e "SELECT radacctid, username, nasipaddress, acctstarttime, acctstoptime, acctsessiontime, acctinputoctets, acctoutputoctets FROM radacct" \
      | sed 's/\t/,/g' > "${csv_path}"; then
    return 0
  fi
  log WARN "Export radacct avec ${DB_USER} échoué, tentative root via socket."
  if mysql -u root -D "${DB_NAME}" \
      -e "SELECT radacctid, username, nasipaddress, acctstarttime, acctstoptime, acctsessiontime, acctinputoctets, acctoutputoctets FROM radacct" \
      | sed 's/\t/,/g' > "${csv_path}"; then
    return 0
  fi
  log WARN "Export radacct CSV échoué (droits insuffisants?). Étape ignorée."
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

check_schema() {
  local report="${WORK_DIR}/schema_checks.txt"
  local tmp_file
  local failures=0

  tmp_file="$(mktemp)"
  : > "${report}"

  log INFO "Vérification du schéma MariaDB attendu (rapport : ${report})."

  if ! mysql_query_any "SELECT 1" > /dev/null; then
    log WARN "Impossible de contacter MariaDB pour les vérifications de schéma."
    {
      echo "[WARN] Impossible de contacter MariaDB avec les identifiants fournis (SELECT 1)."
      echo "       Vérifiez la connectivité et les privilèges de ${DB_USER}@${DB_HOST}:${DB_PORT}."
    } >> "${report}"
    rm -f "${tmp_file}"
    return
  fi

  if mysql_query_any "SHOW COLUMNS FROM permanent_users LIKE 'admin_state';" > "${tmp_file}"; then
    if [[ ! -s "${tmp_file}" ]]; then
      failures=1
      cat >> "${report}" <<'EOT'
[WARN] Colonne `permanent_users.admin_state` absente.
       Action recommandée : appliquer le patch SQL
         cake4/rd_cake/setup/db/8.105_add_suspend_option.sql
       Exemple :
         mysql -u rd -prd rd < /var/www/rdcore/cake4/rd_cake/setup/db/8.105_add_suspend_option.sql
EOT
    fi
  else
    failures=1
    {
      echo "[WARN] Vérification de la colonne permanent_users.admin_state impossible."
      echo "       Consultez les permissions SQL et relancez la migration."
    } >> "${report}"
  fi

  if (( failures == 0 )); then
    echo "[OK] Schéma MariaDB conforme pour les vérifications effectuées." >> "${report}"
    log INFO "Schéma MariaDB conforme."
  else
    log WARN "Des points de schéma MariaDB nécessitent une action (voir ${report})."
  fi

  rm -f "${tmp_file}"
}

copy_metadata() {
  log INFO "Ajout d'un fichier README de restauration"
  cat > "${WORK_DIR}/README.txt" <<'EOT'
Bundle de migration FreeRADIUS + MariaDB généré par migrate_freeradius_mariadb.sh
Contenu principal :
  - mariadb_dump.sql.gz : dump complet de la base RadiusDesk
  - radacct_snapshot.csv : export CSV (optionnel) des sessions
  - freeradius/ : configuration FreeRADIUS (/etc, /var/lib, logs)
  - schema_checks.txt : diagnostics de cohérence pour le schéma MariaDB

Import sur un nouveau serveur :
  1) Installer MariaDB et créer la base cible.
  2) gunzip mariadb_dump.sql.gz && mysql -u <user> -p <base> < mariadb_dump.sql
  3) Synchroniser les dossiers freeradius/ selon la hiérarchie :
       rsync -a freeradius/etc_freeradius/ /etc/freeradius/
       rsync -a freeradius/var_lib_freeradius/ /var/lib/freeradius/
  4) Vérifier les droits (chown -R freerad:freerad ...)
  5) Consulter schema_checks.txt et appliquer les correctifs éventuels.
  6) Redémarrer mariadb et freeradius.
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
check_schema
archive_freeradius
copy_metadata
TARBALL_PATH="$(create_tarball)"
transfer_tarball "$TARBALL_PATH"

log INFO "Migration générée : ${TARBALL_PATH}"
log INFO "Dossier de travail contenant les fichiers : ${WORK_DIR}"
log INFO "=== Fin migration FreeRADIUS + MariaDB (${TIMESTAMP}) ==="
