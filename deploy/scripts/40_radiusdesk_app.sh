#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/40_radiusdesk_app.log"
STEP_NAME="40_radiusdesk_app"
PATCHES_DIR="${BASE_DIR}/templates/patches"
RDCORE_PATH="/var/www/rdcore"
CAKE_DB_DIR="${RDCORE_PATH}/cake4/rd_cake/setup/db"
RD_SQL_DUMP="${CAKE_DB_DIR}/rd.sql"

require_root

MYSQL_ADMIN_USER="${DB_ADMIN_USER-${DB_USER}}"
MYSQL_ADMIN_PASS="${DB_ADMIN_PASS-${DB_PASS:-}}"
MYSQL_ADMIN_HOST="${DB_ADMIN_HOST-${DB_HOST:-127.0.0.1}}"
MYSQL_ADMIN_PORT="${DB_ADMIN_PORT-${DB_PORT:-3306}}"

MYSQL_USE_SOCKET=0
if [[ "${MYSQL_ADMIN_USER}" == "root" && -z "${MYSQL_ADMIN_PASS}" && ( "${MYSQL_ADMIN_HOST}" == "127.0.0.1" || "${MYSQL_ADMIN_HOST}" == "localhost" ) ]]; then
  log WARN "Connexion MySQL root sans mot de passe en socket local."
  MYSQL_USE_SOCKET=1
fi

MYSQL_ARGS=(--batch --skip-column-names -u "${MYSQL_ADMIN_USER}")
if [[ "${MYSQL_USE_SOCKET}" -ne 1 ]]; then
  [[ -n "${MYSQL_ADMIN_HOST:-}" ]] && MYSQL_ARGS+=(-h "${MYSQL_ADMIN_HOST}")
  [[ -n "${MYSQL_ADMIN_PORT:-}" ]] && MYSQL_ARGS+=(-P "${MYSQL_ADMIN_PORT}")
fi

log INFO "MySQL admin cible: ${MYSQL_ADMIN_USER}@${MYSQL_ADMIN_HOST}:${MYSQL_ADMIN_PORT}"

# mysql_exec <database> <sql>
mysql_exec() {
  local database="$1"
  local query="$2"
  local cmd=(mysql "${MYSQL_ARGS[@]}")
  if [[ -n "${database}" ]]; then
    cmd+=("${database}")
  fi
  if [[ -n "${MYSQL_ADMIN_PASS}" ]]; then
    MYSQL_PWD="${MYSQL_ADMIN_PASS}" "${cmd[@]}" -e "${query}"
  else
    "${cmd[@]}" -e "${query}"
  fi
  local rc=$?
  if [[ "${rc}" -ne 0 ]]; then
    log ERROR "mysql_exec a échoué (requête: ${query})"
  fi
  return "${rc}"
}

# mysql_exec_file <database> <file>
mysql_exec_file() {
  local database="$1"
  local file="$2"
  if [[ ! -f "${file}" ]]; then
    log ERROR "Fichier SQL introuvable : ${file}"
    return 1
  fi
  local cmd=(mysql "${MYSQL_ARGS[@]}")
  if [[ -n "${database}" ]]; then
    cmd+=("${database}")
  fi
  if [[ -n "${MYSQL_ADMIN_PASS}" ]]; then
    MYSQL_PWD="${MYSQL_ADMIN_PASS}" "${cmd[@]}" < "${file}"
  else
    "${cmd[@]}" < "${file}"
  fi
  local rc=$?
  if [[ "${rc}" -ne 0 ]]; then
    log ERROR "Import MySQL échoué (fichier ${file}, utilisateur ${MYSQL_ADMIN_USER})."
  fi
  return "${rc}"
}

# table_exists <database> <table>
table_exists() {
  local schema="$1"
  local table="$2"
  local sql="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${schema}' AND table_name='${table}';"
  local count
  if ! count="$(mysql_exec "" "${sql}" 2>/dev/null)"; then
    return 1
  fi
  [[ "${count}" -gt 0 ]]
}

ensure_mysql_timezone_support() {
  log INFO "Vérification du support MySQL CONVERT_TZ avec les timezones configurées."
  local tz_name=""
  tz_name="$(mysql_exec "${DB_NAME}" "SELECT name FROM timezones WHERE name IS NOT NULL AND name <> '' ORDER BY id ASC LIMIT 1;" 2>/dev/null || true)"

  if [[ -z "${tz_name}" ]]; then
    log WARN "Aucune timezone nommée trouvée dans timezones; vérification CONVERT_TZ ignorée."
    return 0
  fi

  local converted=""
  converted="$(mysql_exec "" "SELECT CONVERT_TZ('2000-01-01 00:00:00','${tz_name}','+00:00');" 2>/dev/null || true)"
  if [[ -z "${converted}" || "${converted}" == "NULL" ]]; then
    log WARN "CONVERT_TZ('${tz_name}') retourne NULL. Tentative de chargement des tables timezone MySQL."
    if command -v mysql_tzinfo_to_sql >/dev/null 2>&1; then
      mysql_tzinfo_to_sql /usr/share/zoneinfo | mysql "${MYSQL_ARGS[@]}" mysql || log WARN "Import des timezones MySQL échoué."
      converted="$(mysql_exec "" "SELECT CONVERT_TZ('2000-01-01 00:00:00','${tz_name}','+00:00');" 2>/dev/null || true)"
      if [[ -z "${converted}" || "${converted}" == "NULL" ]]; then
        log WARN "CONVERT_TZ('${tz_name}') reste NULL après import timezone MySQL."
      else
        log INFO "CONVERT_TZ opérationnel après import timezone MySQL."
      fi
    else
      log WARN "mysql_tzinfo_to_sql introuvable; import timezone MySQL impossible."
    fi
  else
    log INFO "Support CONVERT_TZ déjà opérationnel avec timezone '${tz_name}'."
  fi
}

ensure_rd_database_schema() {
  log INFO "Vérification du schéma SQL (${DB_NAME})"
  if ! mysql_exec "" "SELECT 1;" >/dev/null 2>&1; then
    log ERROR "Impossible de se connecter à MySQL (utilisateur ${MYSQL_ADMIN_USER} @ ${MYSQL_ADMIN_HOST}:${MYSQL_ADMIN_PORT})."
    if [[ "${DB_ADMIN_HINTS:-1}" == "1" ]]; then
      log ERROR "Astuce: définissez DB_ADMIN_USER/DB_ADMIN_PASS/DB_ADMIN_HOST/DB_ADMIN_PORT ou créez un compte administrateur dédié avec 'GRANT ALL ON *.* TO \"rdadmin\"@\"localhost\" IDENTIFIED BY \"***\" WITH GRANT OPTION;'."
    fi
    exit 1
  fi

  mysql_exec "" "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

  local anchors=(access_providers permanent_users realms)
  local schema_ready=1
  for tbl in "${anchors[@]}"; do
    if table_exists "${DB_NAME}" "${tbl}"; then
      schema_ready=0
      break
    fi
  done

  if [[ "${schema_ready}" -ne 0 ]]; then
    if [[ -f "${RD_SQL_DUMP}" ]]; then
      log INFO "Import initial de rd.sql (base ${DB_NAME})."
      mysql_exec_file "${DB_NAME}" "${RD_SQL_DUMP}"
    else
      log ERROR "Dump initial ${RD_SQL_DUMP} introuvable."
      exit 1
    fi
  else
    log INFO "Schéma ${DB_NAME} déjà initialisé, pas d'import complet."
  fi

  local patches_applied=0
  if compgen -G "${CAKE_DB_DIR}/8.*.sql" >/dev/null; then
    while IFS= read -r patch; do
      log INFO "Application du patch SQL $(basename "${patch}")."
      if mysql_exec_file "${DB_NAME}" "${patch}"; then
        patches_applied=$((patches_applied + 1))
      else
        log WARN "Patch $(basename "${patch}") a échoué (peut déjà être appliqué)."
      fi
    done < <(find "${CAKE_DB_DIR}" -maxdepth 1 -type f -name '8.*.sql' | sort)
  else
    log WARN "Aucun patch SQL 8.*.sql trouvé dans ${CAKE_DB_DIR}."
  fi
  log INFO "Patches SQL appliqués : ${patches_applied}"

  if table_exists "${DB_NAME}" "passpoint_uplinks"; then
    log INFO "Validation OK : la table passpoint_uplinks est présente."
  else
    log ERROR "La table passpoint_uplinks est absente après import/patch. Vérifiez vos fichiers SQL."
    exit 1
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

if already_done "$STEP_NAME"; then
  log INFO "Étape ${STEP_NAME} déjà marquée comme faite, on saute."
  exit 0
fi

PHP_VERSION="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null || true)"
PHP_FPM_SERVICE=""
if [[ -n "${PHP_VERSION}" ]]; then
  PHP_FPM_SERVICE="php${PHP_VERSION}-fpm"
else
  log WARN "Impossible de détecter la version PHP, tentative de reload générique à la fin."
fi

export DEBIAN_FRONTEND=noninteractive

log INFO "Installation des dépendances PHP supplémentaires."
apt-get install -y php-imagick php-redis redis-server

systemctl enable --now redis-server

log INFO "Synchronisation du code RADIUSdesk."
mkdir -p /var/www
git config --global --add safe.directory "${RDCORE_PATH}" || true
if [[ ! -d "${RDCORE_PATH}" ]]; then
  git clone --branch cake4 --single-branch https://github.com/hasiniaina7/rdcore.git "${RDCORE_PATH}"
else
  git -C "${RDCORE_PATH}" fetch origin cake4 || log WARN "git fetch rdcore a échoué."
  if git -C "${RDCORE_PATH}" rev-parse --verify cake4 >/dev/null 2>&1; then
    git -C "${RDCORE_PATH}" checkout cake4
  else
    git -C "${RDCORE_PATH}" checkout -b cake4 origin/cake4 || log WARN "checkout cake4 échoué."
  fi
  git -C "${RDCORE_PATH}" reset --hard origin/cake4 || log WARN "reset cake4 échoué."
fi

git config --global --add safe.directory /var/www/rd_mobile || true
if [[ ! -d /var/www/rd_mobile ]]; then
  git clone https://github.com/RADIUSdesk/rd_mobile.git /var/www/rd_mobile || log WARN "Clone rd_mobile échoué (optionnel)."
else
  git -C /var/www/rd_mobile pull --ff-only || log WARN "git pull rd_mobile a échoué."
fi

log INFO "Ajustement des permissions avant Composer."
chown -R www-data:www-data "${RDCORE_PATH}" || true
if [[ -d /var/www/rd_mobile ]]; then
  chown -R www-data:www-data /var/www/rd_mobile || true
fi

log INFO "Installation des dépendances Composer de RADIUSdesk."
if [[ -f ${RDCORE_PATH}/cake4/rd_cake/composer.json ]]; then
  sudo -H -u www-data composer install --no-dev --prefer-dist --no-interaction --ignore-platform-req=php+ --working-dir="${RDCORE_PATH}/cake4/rd_cake"
else
  log WARN "composer.json introuvable, saut de composer install."
fi

apply_local_patches

log INFO "Création des liens symboliques dans /var/www/html."
mkdir -p /var/www/html
cd /var/www/html

ln -snf ../rdcore/rd        rd
ln -snf ../rdcore/cake4     cake4
ln -snf ../rdcore/login     login
if [[ -d /var/www/rd_mobile/build/production/RdMobile ]]; then
  ln -snf ../rd_mobile/build/production/RdMobile rd_mobile
fi
ln -snf ../rdcore/AmpConf/build/production/AmpConf conf_dev
ln -snf ../rdcore/cake4/rd_cake/setup/scripts/reporting reporting

CONFIG_FILE="/var/www/rdcore/cake4/rd_cake/config/app_local.php"
SALT_STATE="${STATE_DIR}/cakephp_salt"
if [[ -f "${CONFIG_FILE}" && ! -f "${CONFIG_FILE}.radiusdesk.bak" ]]; then
  cp "${CONFIG_FILE}" "${CONFIG_FILE}.radiusdesk.bak"
fi

if [[ -f "${SALT_STATE}" ]]; then
  CURRENT_SALT="$(cat "${SALT_STATE}")"
else
  CURRENT_SALT="$(php -r 'echo bin2hex(random_bytes(32));')"
  echo "${CURRENT_SALT}" > "${SALT_STATE}"
fi

cat > "${CONFIG_FILE}" <<PHP
<?php
return [
    'debug' => filter_var(env('DEBUG', false), FILTER_VALIDATE_BOOLEAN),
    'Security' => [
        'salt' => env('SECURITY_SALT', '${CURRENT_SALT}'),
    ],
    'Datasources' => [
        'default' => [
            'className' => \\Cake\\Database\\Connection::class,
            'driver' => \\Cake\\Database\\Driver\\Mysql::class,
            'persistent' => false,
            'host' => '${DB_HOST}',
            'port' => ${DB_PORT},
            'username' => '${DB_USER}',
            'password' => '${DB_PASS}',
            'database' => '${DB_NAME}',
            'encoding' => 'utf8mb4',
            'timezone' => 'UTC',
            'cacheMetadata' => true,
            'log' => false,
            'quoteIdentifiers' => false,
            'url' => env('DATABASE_URL', null),
        ],
    ],
    'EmailTransport' => [
        'default' => [
            'host' => 'localhost',
            'port' => 25,
            'username' => null,
            'password' => null,
            'client' => null,
            'url' => env('EMAIL_TRANSPORT_DEFAULT_URL', null),
        ],
    ],
];
PHP

log INFO "Préparation des répertoires logs/tmp."
mkdir -p /var/www/rdcore/cake4/rd_cake/logs
mkdir -p /var/www/rdcore/cake4/rd_cake/tmp/cache/{models,persistent,views}
mkdir -p /var/www/rdcore/cake4/rd_cake/tmp/sessions
mkdir -p /var/www/rdcore/cake4/rd_cake/webroot/files/imagecache
mkdir -p /var/www/rdcore/cake4/rd_cake/webroot/img/{realms,dynamic_details,dynamic_photos,access_providers,hardwares}

chown -R www-data:www-data /var/www/rdcore
chown -R www-data:www-data /var/www/html

ensure_rd_database_schema
ensure_mysql_timezone_support

if [[ -x "${BASE_DIR}/scripts/cleanup_stale_radacct.sh" ]]; then
  log INFO "Nettoyage automatique des sessions radacct orphelines."
  "${BASE_DIR}/scripts/cleanup_stale_radacct.sh" || log WARN "Nettoyage radacct a signalé une erreur."
fi

log INFO "Activation du cron RADIUSdesk."
if [[ -f /var/www/rdcore/cake4/rd_cake/setup/cron/cron4 ]]; then
  cp /var/www/rdcore/cake4/rd_cake/setup/cron/cron4 /etc/cron.d/cron4_radiusdesk
  #cp /var/www/html/cake4/rd_cake/setup/cron/cron4 /etc/cron.d/
  #cp /var/www/html/cake4/rd_cake/setup/cron/cron4 /etc/cron.d/
  chmod 644 /etc/cron.d/cron4_radiusdesk
else
  log WARN "cron4 introuvable, cron non installé."
fi

log INFO "Reload PHP-FPM."
if [[ -n "${PHP_FPM_SERVICE}" ]]; then
  systemctl reload "${PHP_FPM_SERVICE}" || true
else
  systemctl reload php-fpm || true
fi

mark_done "$STEP_NAME"
log INFO "Étape ${STEP_NAME} terminée."
