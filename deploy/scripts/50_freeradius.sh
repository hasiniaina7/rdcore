#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/50_freeradius.log"
STEP_NAME="50_freeradius"

require_root

if already_done "$STEP_NAME"; then
  log INFO "Étape ${STEP_NAME} déjà marquée comme faite, on saute."
  exit 0
fi

export DEBIAN_FRONTEND=noninteractive

log INFO "Installation de FreeRADIUS et de ses modules SQL."
apt-get install -y freeradius freeradius-mysql freeradius-utils \
  libdatetime-perl libdbd-mysql-perl libdigest-hmac-perl libdatetime-format-rfc3339-perl eapoltest

systemctl enable freeradius
systemctl stop freeradius || true

RAD_TAR="/var/www/rdcore/cake4/rd_cake/setup/radius/freeradius-radiusdesk.tar.gz"
if [[ ! -f "${RAD_TAR}" ]]; then
  log ERROR "Archive ${RAD_TAR} introuvable, impossible de déployer la configuration RadiusDesk."
  exit 1
fi

if [[ -d /etc/freeradius && ! -d /etc/freeradius.orig ]]; then
  log INFO "Sauvegarde de /etc/freeradius vers /etc/freeradius.orig."
  mv /etc/freeradius /etc/freeradius.orig
fi

if [[ -d /etc/freeradius ]]; then
  log INFO "Nettoyage de l'arborescence FreeRADIUS actuelle."
  rm -rf /etc/freeradius
fi

log INFO "Extraction de la configuration RadiusDesk."
tar -xzf "${RAD_TAR}" -C /etc

log INFO "Ajustement des permissions FreeRADIUS."
chown -R freerad:freerad /etc/freeradius/3.0
chown freerad:www-data /etc/freeradius
chown freerad:www-data /etc/freeradius/3.0
chown freerad:www-data /etc/freeradius/3.0/dictionary
mkdir -p /var/run/freeradius
chown freerad:freerad /var/run/freeradius

SQL_CONF="/etc/freeradius/3.0/mods-available/sql"
if [[ ! -f "${SQL_CONF}" ]]; then
  log ERROR "Configuration SQL manquante (${SQL_CONF})."
  exit 1
fi

update_sql_conf() {
  local pattern="$1"
  local replacement="$2"
  perl -0pi -e "s/${pattern}/${replacement}/" "${SQL_CONF}"
}

update_sql_conf 'server = "[^"]*"' "server = \"${DB_HOST}\""
if [[ "${DB_PORT}" != "3306" ]]; then
  if grep -q '^\s*#\s*port = 3306' "${SQL_CONF}"; then
    perl -0pi -e "s/^\s*#\s*port = 3306/    port = ${DB_PORT}/" "${SQL_CONF}"
  elif grep -q '^\s*port = ' "${SQL_CONF}"; then
    update_sql_conf 'port = [0-9]+' "port = ${DB_PORT}"
  else
    perl -0pi -e "s/(server = \"${DB_HOST}\")/\$1\n    port = ${DB_PORT}/" "${SQL_CONF}"
  fi
fi
update_sql_conf 'login = "[^"]*"' "login = \"${DB_USER}\""
update_sql_conf 'password = "[^"]*"' "password = \"${DB_PASS}\""
update_sql_conf 'radius_db = "[^"]*"' "radius_db = \"${DB_NAME}\""

ln -sf "${SQL_CONF}" /etc/freeradius/3.0/mods-enabled/sql

DYN_CLIENTS="/etc/freeradius/3.0/sites-available/dynamic-clients"
if [[ -f "${DYN_CLIENTS}" ]]; then
  perl -0pi -e "s/(&FreeRADIUS-Client-Secret = \")[^\"]*(\")/\$1${RADIUS_SECRET_DEFAULT}\$2/" "${DYN_CLIENTS}"
  perl -0pi -e 's/(&FreeRADIUS-Client-Require-MA = )\w+/\1yes/' "${DYN_CLIENTS}"
  if [[ "${RADIUS_CLIENT_NET}" != "0.0.0.0/0" ]]; then
    if grep -q '^\s*#\s*ipaddr = 192\.0\.2\.0/24' "${DYN_CLIENTS}"; then
      perl -0pi -e "s/^\s*#\s*ipaddr = 192\.0\.2\.0\/24/ipaddr = ${RADIUS_CLIENT_NET}/" "${DYN_CLIENTS}"
    elif grep -q '^\s*ipaddr = ' "${DYN_CLIENTS}"; then
      perl -0pi -e "s/^\s*ipaddr = .*/    ipaddr = ${RADIUS_CLIENT_NET}/" "${DYN_CLIENTS}"
    fi
  fi
else
  log WARN "Fichier dynamic-clients introuvable, vérifiez l'archive."
fi

ln -sf ../sites-available/dynamic-clients /etc/freeradius/3.0/sites-enabled/dynamic-clients

DEFAULT_SITE="/etc/freeradius/3.0/sites-available/default"
INNER_TUNNEL="/etc/freeradius/3.0/sites-available/inner-tunnel"
for site in "${DEFAULT_SITE}" "${INNER_TUNNEL}"; do
  if [[ -f "${site}" ]]; then
    perl -0pi -e 's/^(\s*)filter_username/\1# filter_username/m' "${site}" || true
    ln -sf "${site}" "/etc/freeradius/3.0/sites-enabled/$(basename "${site}")"
  fi
done

CLIENTS_CONF="/etc/freeradius/3.0/clients.conf"
if [[ -f "${CLIENTS_CONF}" ]]; then
  perl -0pi -e 's/(client\s+localhost\s*\{[^}]*?require_message_authenticator\s*=\s*)\w+/\1yes/si' "${CLIENTS_CONF}"
fi

mkdir -p /var/log/freeradius/sqltrace
chown -R freerad:freerad /var/log/freeradius

log INFO "Vérification de la configuration FreeRADIUS."
freeradius -C || { log ERROR "freeradius -C a échoué."; exit 1; }

log INFO "Redémarrage de FreeRADIUS."
systemctl restart freeradius

mark_done "$STEP_NAME"
log INFO "Étape ${STEP_NAME} terminée."
