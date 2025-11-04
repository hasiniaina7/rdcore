#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/10_base_os.log"
STEP_NAME="10_base_os"

require_root

if already_done "$STEP_NAME"; then
  log INFO "Étape ${STEP_NAME} déjà marquée comme faite, on saute."
  exit 0
fi

export DEBIAN_FRONTEND=noninteractive

log INFO "Mise à jour du système."
apt-get update -y
apt-get upgrade -y

log INFO "Installation des paquets de base."
apt-get install -y \
  ca-certificates curl wget git vim htop gnupg lsb-release \
  software-properties-common unzip tar jq

if [[ -n "${TIMEZONE:-}" ]]; then
  log INFO "Configuration du fuseau horaire ${TIMEZONE}."
  timedatectl set-timezone "${TIMEZONE}" || log WARN "Impossible de changer le timezone (TZ invalide ?)."
fi

if [[ -n "${SERVER_HOSTNAME:-}" ]]; then
  log INFO "Configuration du hostname ${SERVER_HOSTNAME}."
  hostnamectl set-hostname "${SERVER_HOSTNAME}" || log WARN "Impossible de changer le hostname."
fi

mark_done "$STEP_NAME"
log INFO "Étape ${STEP_NAME} terminée."
