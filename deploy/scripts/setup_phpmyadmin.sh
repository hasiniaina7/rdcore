#!/usr/bin/env bash
set -euo pipefail

# phpMyAdmin one-shot setup for Nginx + PHP-FPM.
# - Installs phpMyAdmin + required PHP extensions.
# - Enables mbstring and reloads PHP-FPM.
# - Writes an Nginx snippet limited to loopback for /phpmyadmin/.
# - Prints next steps (include snippet, test, reload, and SSH tunnel access).
#
# Usage (run manually after base install scripts):
#   sudo ./scripts/setup_phpmyadmin.sh
#
# Notes:
# - Does NOT touch your main vhost; you must include the snippet yourself.
# - Designed for systems with PHP-FPM and Nginx already installed.

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo ./scripts/setup_phpmyadmin.sh)" >&2
  exit 1
fi

PHP_FPM_SOCKET=""
if compgen -G "/var/run/php/php*fpm.sock" >/dev/null; then
  PHP_FPM_SOCKET="$(ls /var/run/php/php*fpm.sock | head -n1)"
fi
PHP_FPM_SERVICE=""
if compgen -G "/etc/systemd/system/php*.service /lib/systemd/system/php*.service" >/dev/null; then
  PHP_FPM_SERVICE="$(basename "$(ls /etc/systemd/system/php*-fpm.service /lib/systemd/system/php*-fpm.service 2>/dev/null | head -n1)" 2>/dev/null || true)"
fi

echo "==> Installing phpMyAdmin + PHP extensions"
export DEBIAN_FRONTEND=noninteractive
echo "phpmyadmin phpmyadmin/reconfigure-webserver multiselect" | debconf-set-selections
apt-get update
apt-get install -y phpmyadmin php-mysql php-mbstring php-zip php-gd php-json php-curl --no-install-recommends

echo "==> Enabling mbstring"
phpenmod mbstring

if [[ -n "$PHP_FPM_SERVICE" ]]; then
  echo "==> Reloading $PHP_FPM_SERVICE"
  systemctl reload "$PHP_FPM_SERVICE"
else
  echo "WARN: PHP-FPM service not detected automatically; reload it manually." >&2
fi

SNIPPET_PATH="/etc/nginx/snippets/phpmyadmin.conf"
echo "==> Writing Nginx snippet to $SNIPPET_PATH"
cat > "$SNIPPET_PATH" <<EOF
# phpMyAdmin (loopback only)
location /phpmyadmin/ {
    alias /usr/share/phpmyadmin/;
    index index.php;
    try_files \$uri \$uri/ =404;

    allow 127.0.0.1;
    allow ::1;
    deny all;

    location ~ \\.php\$ {
        fastcgi_pass unix:${PHP_FPM_SOCKET:-/var/run/php/php8.2-fpm.sock};
        include snippets/fastcgi-php.conf;
        fastcgi_param SCRIPT_FILENAME \$request_filename;
    }
}
EOF

echo "==> Next steps (manual)"
echo "1) Include the snippet inside your Nginx server block, e.g.:"
echo "     include /etc/nginx/snippets/phpmyadmin.conf;"
echo "   (Edit /etc/nginx/sites-available/radiusdesk.conf or the relevant vhost)."
echo "   Reminder block if you prefer inline instead of include:"
echo "   location /phpmyadmin/ {"
echo "       alias /usr/share/phpmyadmin/;"
echo "       index index.php;"
echo "       try_files \$uri \$uri/ =404;"
echo "       allow 127.0.0.1;"
echo "       allow ::1;"
echo "       deny all;"
echo "       location ~ \\.php\$ {"
echo "           fastcgi_pass unix:${PHP_FPM_SOCKET:-/var/run/php/php8.2-fpm.sock};"
echo "           include snippets/fastcgi-php.conf;"
echo "           fastcgi_param SCRIPT_FILENAME \$request_filename;"
echo "       }"
echo "   }"
echo "2) Test and reload Nginx:"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo "3) Access locally on the server: https://127.0.0.1/phpmyadmin/ (or http)."
echo "4) Access remotely via SSH tunnel (HTTPS example):"
echo "     ssh -L 8443:127.0.0.1:443 -i /home/mastershark-linux/ssh/desk-pem.pem ubuntu@hotspot.techzone.lat"
echo "     puis ouvrez https://localhost:8443/phpmyadmin/"
echo "5) Ensure MySQL is not exposed: bind to 127.0.0.1 in mysqld.cnf and restart mysql if needed."
echo "Done."
