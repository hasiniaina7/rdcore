#!/usr/bin/env bash
# Ferme automatiquement les sessions RADIUS (radacct) restées ouvertes après une migration.
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/cleanup_stale_radacct.log"

require_root

STALE_SESSION_GRACE_SECONDS="${STALE_SESSION_GRACE_SECONDS:-900}"
DB_USER_CLEANUP="${DB_USER_CLEANUP:-root}"

declare -a MYSQL_AUTH=("-u" "${DB_USER_CLEANUP}")
if [[ "${DB_USER_CLEANUP}" != "root" ]]; then
  if [[ -n "${DB_HOST:-}" ]]; then
    MYSQL_AUTH+=("-h" "${DB_HOST}")
  fi
  if [[ -n "${DB_PORT:-}" ]]; then
    MYSQL_AUTH+=("-P" "${DB_PORT}")
  fi
fi

if [[ -n "${DB_PASS:-}" && "${DB_USER_CLEANUP}" != "root" ]]; then
  MYSQL_AUTH+=("--password=${DB_PASS}")
fi

mysql_exec() {
  mysql "${MYSQL_AUTH[@]}" "${DB_NAME}" "$@"
}

ensure_history_column() {
  local column="$1"
  local definition="$2"
  if ! mysql_exec -N -B -e "SHOW COLUMNS FROM radacct_history LIKE '${column}'" | grep -q "${column}"; then
    log INFO "Ajout de la colonne radacct_history.${column}."
    mysql_exec -e "ALTER TABLE radacct_history ADD COLUMN ${definition};"
  fi
}

ensure_history_column "framedipv6address" "\`framedipv6address\` varchar(44) NOT NULL DEFAULT '' AFTER \`operator_name\`"
ensure_history_column "framedipv6prefix" "\`framedipv6prefix\` varchar(44) NOT NULL DEFAULT '' AFTER \`framedipv6address\`"
ensure_history_column "framedinterfaceid" "\`framedinterfaceid\` varchar(44) NOT NULL DEFAULT '' AFTER \`framedipv6prefix\`"
ensure_history_column "delegatedipv6prefix" "\`delegatedipv6prefix\` varchar(44) NOT NULL DEFAULT '' AFTER \`framedinterfaceid\`"

CUTOFF_TS="$(date -u -d "-${STALE_SESSION_GRACE_SECONDS} seconds" +"%Y-%m-%d %H:%M:%S")"
log INFO "Nettoyage des sessions radacct sans date de fin (grace ${STALE_SESSION_GRACE_SECONDS}s, cutoff ${CUTOFF_TS})."

WHERE_CLAUSE=$(cat <<SQL
acctstoptime IS NULL
  AND (
        (acctupdatetime IS NOT NULL AND acctupdatetime < '${CUTOFF_TS}')
     OR (acctupdatetime IS NULL AND acctstarttime < '${CUTOFF_TS}')
  )
SQL
)
COUNT_SQL="SELECT COUNT(*) FROM radacct WHERE ${WHERE_CLAUSE};"
ROWS=$(mysql_exec -N -B -e "${COUNT_SQL}" 2>&1) || {
  log ERROR "Échec du comptage des sessions: ${ROWS}"
  exit 1
}
ROWS="$(echo "${ROWS}" | tail -n 1 | tr -d $'\r')"

UPDATE_SQL=$(cat <<SQL
UPDATE radacct
SET
    acctstoptime = COALESCE(acctupdatetime, UTC_TIMESTAMP()),
    acctupdatetime = COALESCE(acctupdatetime, UTC_TIMESTAMP()),
    acctterminatecause = COALESCE(acctterminatecause, 'Clear-Stale-Session'),
    acctsessiontime = COALESCE(
        acctsessiontime,
        GREATEST(0, TIMESTAMPDIFF(SECOND, acctstarttime, COALESCE(acctupdatetime, UTC_TIMESTAMP())))
    )
WHERE ${WHERE_CLAUSE};
SQL
)

if ! mysql_exec -N -B -e "${UPDATE_SQL}"; then
  log ERROR "Échec du nettoyage des sessions (UPDATE)."
  exit 1
fi

log INFO "Sessions fermées automatiquement: ${ROWS}"
