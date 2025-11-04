#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/30_mariadb.log"
STEP_NAME="30_mariadb"

require_root

if already_done "$STEP_NAME"; then
  log INFO "Étape ${STEP_NAME} déjà marquée comme faite, on saute."
  exit 0
fi

export DEBIAN_FRONTEND=noninteractive

log INFO "Installation MariaDB + extension PHP."
apt-get install -y mariadb-server mariadb-client php-mysql

systemctl enable --now mariadb

log INFO "Désactivation du strict SQL mode."
DISABLE_STRICT_CONF="/etc/mysql/conf.d/disable_strict_mode.cnf"
if [[ ! -f "${DISABLE_STRICT_CONF}" ]]; then
  cat > "${DISABLE_STRICT_CONF}" <<'EOF'
[mysqld]
sql_mode=IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
EOF
else
  log INFO "${DISABLE_STRICT_CONF} déjà présent."
fi

log INFO "Activation de l'Event Scheduler."
EVENT_SCHED_CONF="/etc/mysql/conf.d/enable_event_scheduler.cnf"
if [[ ! -f "${EVENT_SCHED_CONF}" ]]; then
  cat > "${EVENT_SCHED_CONF}" <<'EOF'
[mysqld]
event_scheduler=on
EOF
else
  log INFO "${EVENT_SCHED_CONF} déjà présent."
fi

log INFO "Redémarrage MariaDB."
systemctl restart mariadb

log INFO "Import des timezones MySQL (idempotent)."
mysql_tzinfo_to_sql /usr/share/zoneinfo | mysql -u root mysql || log WARN "Import TZ MySQL a échoué."

log INFO "Création/ajustement de la base et des comptes SQL."
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
CREATE USER IF NOT EXISTS 'freeradius'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
GRANT SELECT,INSERT,UPDATE,DELETE ON ${DB_NAME}.* TO 'freeradius'@'localhost';
FLUSH PRIVILEGES;
EOF

log INFO "Vous pouvez exposer la base à distance en ajustant bind-address et les GRANT si besoin."

mark_done "$STEP_NAME"
log INFO "Étape ${STEP_NAME} terminée."
