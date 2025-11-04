#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/70_tls_certbot.log"
STEP_NAME="70_tls_certbot"

require_root

if already_done "$STEP_NAME"; then
  log INFO "Étape ${STEP_NAME} déjà marquée comme faite, on saute."
  exit 0
fi

export DEBIAN_FRONTEND=noninteractive

log INFO "Installation de certbot (snap)."
apt-get install -y snapd || true
snap install core || true
snap refresh core || true
snap install --classic certbot || true

if ! command -v certbot >/dev/null 2>&1; then
  log WARN "certbot non disponible après installation, vérifier snap."
  mark_done "$STEP_NAME"
  exit 0
fi

if [[ "${AUTO_LE}" == "1" ]]; then
  log INFO "AUTO_LE=1 → tentative d'obtention de certificat avec plugin nginx."
  certbot --nginx \
    -d "${SERVER_FQDN}" \
    -m "${LE_EMAIL}" \
    --agree-tos \
    --redirect \
    --non-interactive || log WARN "certbot --nginx a échoué."
else
  log INFO "AUTO_LE=0 → aucun certbot automatique lancé."
  log INFO "Exemple (HTTP-01) une fois le DNS pointé sur ce serveur:"
  log INFO "  certbot --nginx -d ${SERVER_FQDN} -m ${LE_EMAIL} --agree-tos --redirect"
  log INFO "Pour un challenge DNS-01 manuel:"
  log INFO "  certbot certonly --manual --preferred-challenges dns -d ${SERVER_FQDN} -m ${LE_EMAIL} --agree-tos"
fi

mark_done "$STEP_NAME"
log INFO "Étape ${STEP_NAME} terminée."
