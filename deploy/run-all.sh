#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

for script in \
  "${BASE_DIR}/scripts/10_base_os.sh" \
  "${BASE_DIR}/scripts/20_web_php.sh" \
  "${BASE_DIR}/scripts/30_mariadb.sh" \
  "${BASE_DIR}/scripts/40_radiusdesk_app.sh" \
  "${BASE_DIR}/scripts/50_freeradius.sh" \
  "${BASE_DIR}/scripts/70_tls_certbot.sh"
do
  if [[ -x "${script}" ]]; then
    echo ">> Exécution ${script}"
    "${script}"
  else
    echo "Script ${script} non exécutable ou introuvable." >&2
    exit 1
  fi
done
