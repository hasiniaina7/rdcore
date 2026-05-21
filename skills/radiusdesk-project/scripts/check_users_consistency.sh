#!/usr/bin/env bash
set -euo pipefail

CLOUD_ID="${1:-24}"
REALM_ID="${2:-20}"
REALM_NAME="${3:-PROD}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_NAME="${DB_NAME:-rd}"
DB_USER="${DB_USER:-rd}"
DB_PASS="${DB_PASS:-rd}"

mysql -h "$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -D "$DB_NAME" <<SQL
SELECT COUNT(*) AS sessions_all_open
FROM radacct
WHERE acctstoptime IS NULL;

SELECT COUNT(*) AS sessions_open_realm_field
FROM radacct
WHERE acctstoptime IS NULL AND realm='${REALM_NAME}';

SELECT COUNT(DISTINCT pu.id) AS permanent_online_current_logic
FROM permanent_users pu
JOIN radacct ra ON ra.username = pu.username AND ra.acctstoptime IS NULL
WHERE pu.cloud_id=${CLOUD_ID} AND pu.realm_id=${REALM_ID};

SELECT COUNT(DISTINCT v.id) AS voucher_online_current_logic
FROM vouchers v
JOIN radacct ra ON ra.username = v.name AND ra.acctstoptime IS NULL
WHERE v.cloud_id=${CLOUD_ID} AND v.realm_id=${REALM_ID};

SELECT COUNT(*) AS sessions_open_linked_to_cloud_users
FROM radacct ra
WHERE ra.acctstoptime IS NULL
AND (
    EXISTS (SELECT 1 FROM permanent_users pu WHERE pu.cloud_id=${CLOUD_ID} AND pu.realm_id=${REALM_ID} AND pu.username=ra.username)
 OR EXISTS (SELECT 1 FROM vouchers v WHERE v.cloud_id=${CLOUD_ID} AND v.realm_id=${REALM_ID} AND v.name=ra.username)
 OR EXISTS (SELECT 1 FROM devices d JOIN permanent_users pu2 ON pu2.id=d.permanent_user_id WHERE pu2.cloud_id=${CLOUD_ID} AND pu2.realm_id=${REALM_ID} AND d.name=ra.username)
);
SQL
