#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/20_web_php.log"
STEP_NAME="20_web_php"

require_root

if already_done "$STEP_NAME"; then
  log INFO "Étape ${STEP_NAME} déjà marquée comme faite, on saute."
  exit 0
fi

if [[ "${WEB_STACK}" != "nginx" ]]; then
  log WARN "WEB_STACK=${WEB_STACK} non géré, utilisation par défaut de nginx."
fi

export DEBIAN_FRONTEND=noninteractive

log INFO "Installation Nginx + PHP-FPM."
apt-get install -y nginx \
  php-fpm php-cli php-common \
  php-gd php-curl php-xml php-mbstring php-intl php-mysql php-zip php-bcmath php-soap php-ldap \
  composer

systemctl enable --now nginx

PHP_VERSION="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null || true)"
if [[ -z "${PHP_VERSION}" ]]; then
  log ERROR "PHP non disponible après installation."
  exit 1
fi

PHP_FPM_SERVICE="php${PHP_VERSION}-fpm"
PHP_FPM_SOCK="/var/run/php/php${PHP_VERSION}-fpm.sock"

systemctl enable --now "${PHP_FPM_SERVICE}"

log INFO "PHP détecté: ${PHP_VERSION}, service ${PHP_FPM_SERVICE}."

SITE_CONF="/etc/nginx/sites-available/radiusdesk.conf"

if [[ ! -f "${SITE_CONF}" ]]; then
  log INFO "Création du virtualhost Nginx ${SITE_CONF}."
  cat > "${SITE_CONF}" <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${SERVER_FQDN} ${SERVER_HOSTNAME} _;

    root /var/www/html;
    index index.php index.html index.htm;

    client_max_body_size 20m;

    location / {
        try_files \$uri \$uri/ /index.php\$is_args\$args;
    }

    location /cake4/rd_cake {
        rewrite ^/cake4/rd_cake(.+)\$ /cake4/rd_cake/webroot\$1 break;
        try_files \$uri \$uri/ /cake4/rd_cake/index.php\$is_args\$args;
    }

    location /cake4/rd_cake/node-reports/submit_report.json {
        try_files \$uri \$uri/ /reporting/reporting.php;
    }

    location ~ ^/cake4/.+\\.(jpg|jpeg|gif|png|ico|js|css|woff2?)\$ {
        rewrite ^/cake4/rd_cake/webroot/(.*)\$ /cake4/rd_cake/webroot/\$1 break;
        rewrite ^/cake4/rd_cake/(.*)\$ /cake4/rd_cake/webroot/\$1 break;
        access_log off;
        expires 30d;
        add_header Cache-Control "public";
        try_files \$uri \$uri/ =404;
    }

    location ~ \\.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:${PHP_FPM_SOCK};
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        fastcgi_read_timeout 180;
    }

    location ~* /(config|tmp|logs)/ {
        deny all;
    }
}
EOF
else
  log INFO "Fichier ${SITE_CONF} déjà présent, non modifié."
fi

if grep -qE 'fastcgi_pass unix:/var/run/php/php[0-9.]+-fpm\.sock;' "${SITE_CONF}"; then
  log INFO "Mise à jour du socket PHP-FPM dans ${SITE_CONF}."
  perl -0pi -e "s#fastcgi_pass unix:/var/run/php/php[0-9.]+-fpm\\.sock;#fastcgi_pass unix:${PHP_FPM_SOCK};#g" "${SITE_CONF}"
fi

if [[ -f /etc/nginx/sites-enabled/default ]]; then
  log INFO "Désactivation du site par défaut Nginx."
  rm -f /etc/nginx/sites-enabled/default
fi

if [[ ! -f /etc/nginx/sites-enabled/radiusdesk.conf ]]; then
  ln -s "${SITE_CONF}" /etc/nginx/sites-enabled/radiusdesk.conf
fi

log INFO "Test de configuration Nginx."
nginx -t

log INFO "Reload Nginx."
systemctl reload nginx

mark_done "$STEP_NAME"
log INFO "Étape ${STEP_NAME} terminée."
