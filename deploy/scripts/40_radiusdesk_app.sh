#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/40_radiusdesk_app.log"
STEP_NAME="40_radiusdesk_app"

require_root

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
git config --global --add safe.directory /var/www/rdcore || true
if [[ ! -d /var/www/rdcore ]]; then
  git clone --branch cake4 --single-branch https://github.com/hasiniaina7/rdcore.git /var/www/rdcore
else
  git -C /var/www/rdcore fetch origin cake4 || log WARN "git fetch rdcore a échoué."
  if git -C /var/www/rdcore rev-parse --verify cake4 >/dev/null 2>&1; then
    git -C /var/www/rdcore checkout cake4
  else
    git -C /var/www/rdcore checkout -b cake4 origin/cake4 || log WARN "checkout cake4 échoué."
  fi
  git -C /var/www/rdcore reset --hard origin/cake4 || log WARN "reset cake4 échoué."
fi

git config --global --add safe.directory /var/www/rd_mobile || true
if [[ ! -d /var/www/rd_mobile ]]; then
  git clone https://github.com/RADIUSdesk/rd_mobile.git /var/www/rd_mobile || log WARN "Clone rd_mobile échoué (optionnel)."
else
  git -C /var/www/rd_mobile pull --ff-only || log WARN "git pull rd_mobile a échoué."
fi

log INFO "Ajustement des permissions avant Composer."
chown -R www-data:www-data /var/www/rdcore || true
if [[ -d /var/www/rd_mobile ]]; then
  chown -R www-data:www-data /var/www/rd_mobile || true
fi

log INFO "Installation des dépendances Composer de RADIUSdesk."
if [[ -f /var/www/rdcore/cake4/rd_cake/composer.json ]]; then
  sudo -H -u www-data composer install --no-dev --prefer-dist --no-interaction --working-dir=/var/www/rdcore/cake4/rd_cake
else
  log WARN "composer.json introuvable, saut de composer install."
fi

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

log INFO "Initialisation de la base RADIUSdesk si nécessaire."
SCHEMA_COUNT=$(mysql -u root -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}'" || echo "0")
if [[ "${SCHEMA_COUNT}" -eq 0 ]]; then
  if [[ -f /var/www/rdcore/cake4/rd_cake/setup/db/rd.sql ]]; then
    log INFO "Import du schéma rd.sql dans ${DB_NAME}."
    mysql -u root "${DB_NAME}" < /var/www/rdcore/cake4/rd_cake/setup/db/rd.sql
  else
    log WARN "Fichier rd.sql introuvable, import DB non effectué."
  fi
else
  log INFO "La base ${DB_NAME} contient déjà ${SCHEMA_COUNT} tables, aucune importation."
fi

PATCH_DIR="/var/www/rdcore/cake4/rd_cake/setup/db"
PATCH_STATE_DIR="${STATE_DIR}/sql_patches"
mkdir -p "${PATCH_STATE_DIR}"
if compgen -G "${PATCH_DIR}/8.*.sql" >/dev/null; then
  while IFS= read -r patch; do
    patch_name="$(basename "${patch}")"
    marker="${PATCH_STATE_DIR}/${patch_name}.done"
    if [[ -f "${marker}" ]]; then
      log INFO "Patch SQL ${patch_name} déjà appliqué."
      continue
    fi
    log INFO "Application du patch SQL ${patch_name}."
    if mysql --force -u root "${DB_NAME}" < "${patch}"; then
      log INFO "Patch ${patch_name} appliqué."
    else
      log WARN "Patch ${patch_name} a retourné des avertissements (peut déjà être appliqué)."
    fi
    touch "${marker}"
  done < <(find "${PATCH_DIR}" -maxdepth 1 -type f -name '8.*.sql' -print | sort)
else
  log WARN "Aucun patch SQL complémentaire trouvé dans ${PATCH_DIR}."
fi

log INFO "Activation du cron RADIUSdesk."
if [[ -f /var/www/rdcore/cake4/rd_cake/setup/cron/cron4 ]]; then
  cp /var/www/rdcore/cake4/rd_cake/setup/cron/cron4 /etc/cron.d/cron4_radiusdesk
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
