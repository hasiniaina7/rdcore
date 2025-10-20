#!/usr/bin/env bash
set -euo pipefail

# Ensure runtime directories exist and are writable after bind mounts
RUNTIME_DIRS=(
  /var/www/rdcore/cake4/rd_cake/logs
  /var/www/rdcore/cake4/rd_cake/tmp
  /var/www/rdcore/cake4/rd_cake/tmp/cache
  /var/www/rdcore/cake4/rd_cake/tmp/cache/models
  /var/www/rdcore/cake4/rd_cake/tmp/cache/persistent
  /var/www/rdcore/cake4/rd_cake/tmp/cache/views
  /var/www/rdcore/cake4/rd_cake/tmp/sessions
  /var/www/rdcore/cake4/rd_cake/tmp/tests
  /var/www/rdcore/cake4/rd_cake/webroot/files/imagecache
)

for dir in "${RUNTIME_DIRS[@]}"; do
  mkdir -p "$dir"
done

chmod +x /var/www/rdcore/cake4/rd_cake/setup/scripts/radmin_wrapper.pl /var/www/rdcore/cake4/rd_cake/setup/scripts/radscenario.pl || true

chown -R www-data:www-data /var/www/rdcore/cake4/rd_cake/logs
chown -R www-data:www-data /var/www/rdcore/cake4/rd_cake/tmp
chown -R www-data:www-data /var/www/rdcore/cake4/rd_cake/webroot/files

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
