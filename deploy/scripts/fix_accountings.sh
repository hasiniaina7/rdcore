#!/usr/bin/env bash
set -euo pipefail

# Batch requeue of vouchers/permanent users so that Cake's accounting job
# recalculates data/time usage after a migration.
#
# Usage:
#   sudo ./deploy/scripts/fix_accountings.sh
#
# Tunables (env vars):
#   MYSQL_CMD  : mysql CLI command (default "mysql")
#   DB_NAME    : database name (default "rd")
#   BATCH_SIZE : number of usernames per batch (default 200)
#   CAKE_ROOT  : Cake install dir (default /var/www/html/cake4/rd_cake)
#   PHP_BIN    : PHP binary (default "php")
#   CAKE_USER  : User running Cake (default "www-data")

MYSQL_CMD=${MYSQL_CMD:-"sudo mysql"}
DB_NAME=${DB_NAME:-rd}
BATCH_SIZE=${BATCH_SIZE:-200}
CAKE_ROOT=${CAKE_ROOT:-/var/www/html/cake4/rd_cake}
PHP_BIN=${PHP_BIN:-php}
CAKE_USER=${CAKE_USER:-www-data}
LOG_FILE=${LOG_FILE:-/var/log/fix_accountings.log}

CAKE_BIN="${CAKE_ROOT}/bin/cake.php"

if [[ ! -x "${CAKE_ROOT}/bin/cake" && ! -f "${CAKE_BIN}" ]]; then
  echo "[-] Cake directory not found at ${CAKE_ROOT}" >&2
  exit 1
fi

mkdir -p "$(dirname "${LOG_FILE}")"
touch "${LOG_FILE}"

log() {
  local line="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "${line}" | tee -a "${LOG_FILE}"
}

TOTAL=$(${MYSQL_CMD} -N -B "${DB_NAME}" \
  -e "SELECT COUNT(DISTINCT username) FROM user_stats WHERE username <> '';")

if (( TOTAL == 0 )); then
  log "[*] No usernames found in user_stats. Nothing to do."
  exit 0
fi

log "[*] Processing ${TOTAL} usernames in batches of ${BATCH_SIZE}"

offset=0
while (( offset < TOTAL )); do
  mapfile -t BATCH_USERS < <(
    ${MYSQL_CMD} -N -B "${DB_NAME}" \
  -e "SELECT us.username
           FROM user_stats us
           JOIN radacct r ON us.radacct_id = r.radacctid
          WHERE us.username <> '' AND r.acctstoptime IS NOT NULL
       GROUP BY us.username
       ORDER BY us.username
       LIMIT ${BATCH_SIZE} OFFSET ${offset};"
  )

  if (( ${#BATCH_USERS[@]} == 0 )); then
    break
  fi

  log "[*] Re-queueing batch offset ${offset} (users: ${BATCH_USERS[*]})"

  quoted=$(printf "'%s'," "${BATCH_USERS[@]}")
  quoted=${quoted%,}

  ${MYSQL_CMD} "${DB_NAME}" <<SQL
DELETE FROM new_accountings;
INSERT IGNORE INTO new_accountings (mac, username)
SELECT DISTINCT callingstationid, username
FROM user_stats
WHERE username IN (${quoted}) AND callingstationid <> '';
SQL

  log "[*] Running Cake accounting job..."
  {
    cd "${CAKE_ROOT}" && sudo -u "${CAKE_USER}" "${PHP_BIN}" "${CAKE_BIN}" accounting
  } >> "${LOG_FILE}" 2>&1 || log "[!] Cake accounting exited with errors (see log)."

  offset=$(( offset + BATCH_SIZE ))
done

log "[*] Completed processing ${TOTAL} usernames."
