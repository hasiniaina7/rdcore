#!/usr/bin/env bash
# Reparations radacct.realm + trigger pour futurs inserts

set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/fix_radacct_realms.log"
require_root

DB_NAME="${DB_NAME:-rd}"
MYSQL_USER="${DB_ADMIN_USER:-${DB_USER:-root}}"
MYSQL_PASS="${DB_ADMIN_PASS:-${DB_PASS:-}}"
MYSQL_HOST="${DB_HOST:-127.0.0.1}"
MYSQL_PORT="${DB_PORT:-3306}"

mysql_exec(){
  local sql="$1"
  MYSQL_PWD="${MYSQL_PASS}" mysql \
    -h "${MYSQL_HOST}" -P "${MYSQL_PORT}" \
    -u "${MYSQL_USER}" --batch --skip-column-names \
    "${DB_NAME}" -e "${sql}"
}

mysql_exec_stdin(){
  MYSQL_PWD="${MYSQL_PASS}" mysql \
    -h "${MYSQL_HOST}" -P "${MYSQL_PORT}" \
    -u "${MYSQL_USER}" "${DB_NAME}"
}

log INFO "Backfill (permanent_users)."
mysql_exec "\
  UPDATE radacct ra\
  JOIN permanent_users pu ON pu.username = ra.username\
  JOIN realms r ON r.id = pu.realm_id\
  SET ra.realm = r.name\
  WHERE (ra.realm IS NULL OR ra.realm = '') AND r.name IS NOT NULL;\
"

log INFO "Backfill (vouchers)."
mysql_exec "\
  UPDATE radacct ra\
  JOIN vouchers v ON v.name = ra.username\
  JOIN realms r ON r.id = v.realm_id\
  SET ra.realm = r.name\
  WHERE (ra.realm IS NULL OR ra.realm = '') AND r.name IS NOT NULL;\
"

log INFO "Backfill (devices)."
mysql_exec "\
  UPDATE radacct ra\
  JOIN devices d ON d.name = ra.username\
  JOIN realms r ON r.id = d.realm_id\
  SET ra.realm = r.name\
  WHERE (ra.realm IS NULL OR ra.realm = '') AND r.name IS NOT NULL;\
"

log INFO "Backfill (radcheck Rd-Realm)."
mysql_exec "\
  UPDATE radacct ra\
  JOIN radcheck rc ON rc.username = ra.username AND rc.attribute = 'Rd-Realm'\
  SET ra.realm = rc.value\
  WHERE (ra.realm IS NULL OR ra.realm = '') AND rc.value IS NOT NULL;\
"

log INFO "Suppression trigger existant."
mysql_exec "DROP TRIGGER IF EXISTS bi_radacct_realm;"

log INFO "Installation du trigger bi_radacct_realm."
mysql_exec_stdin <<'EOF'
DELIMITER //
CREATE TRIGGER bi_radacct_realm
BEFORE INSERT ON radacct
FOR EACH ROW
BEGIN
  DECLARE realm_name VARCHAR(64);
  IF NEW.realm IS NULL OR NEW.realm = '' THEN
    SELECT r.name INTO realm_name
      FROM permanent_users pu JOIN realms r ON r.id = pu.realm_id
     WHERE pu.username = NEW.username LIMIT 1;
    IF realm_name IS NULL THEN
      SELECT r.name INTO realm_name
        FROM vouchers v JOIN realms r ON r.id = v.realm_id
       WHERE v.name = NEW.username LIMIT 1;
    END IF;
    IF realm_name IS NULL THEN
      SELECT r.name INTO realm_name
        FROM devices d JOIN realms r ON r.id = d.realm_id
       WHERE d.name = NEW.username LIMIT 1;
    END IF;
    IF realm_name IS NULL THEN
      SELECT value INTO realm_name
        FROM radcheck
       WHERE username = NEW.username AND attribute = 'Rd-Realm'
       LIMIT 1;
    END IF;
    IF realm_name IS NOT NULL THEN
      SET NEW.realm = realm_name;
    END IF;
  END IF;
END//
DELIMITER ;
EOF

log INFO "Contrôle final :"
mysql_exec "SELECT COUNT(*) total, SUM(realm IS NULL OR realm='') empty FROM radacct;"
log INFO "Correctif radacct terminé."
