#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${BASE_DIR}/lib/common.sh"

usage() {
  cat <<USAGE
Purge sélective des marqueurs d'état d'installation.

Usage:
  $(basename "$0") [options]

Options:
  -l, --list                 Lister les marqueurs existants
  -a, --all                  Supprimer tous les *.done (toutes étapes)
  -p, --phase PHASE          Supprimer une phase (ex: 10,20,30,40,50,70)
      --patches              Purger les marqueurs des patchs SQL
      --state-dir DIR        Écraser le répertoire d'état (défaut: ${STATE_DIR})
  -y, --yes                  Ne pas demander de confirmation
  -h, --help                 Afficher cette aide

Exemples:
  $(basename "$0") --list
  $(basename "$0") --phase 40 --patches -y
  $(basename "$0") --all -y
USAGE
}

CONFIRM=0
PHASE=""
DO_ALL=0
DO_LIST=0
DO_PATCHES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--list) DO_LIST=1; shift;;
    -a|--all) DO_ALL=1; shift;;
    -p|--phase) PHASE="${2:-}"; shift 2;;
    --patches) DO_PATCHES=1; shift;;
    --state-dir) STATE_DIR="${2:-}"; shift 2;;
    -y|--yes) CONFIRM=1; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Option inconnue: $1" >&2; usage; exit 1;;
  esac
done

list_markers() {
  echo "Etat dans: ${STATE_DIR}"
  if compgen -G "${STATE_DIR}/*.done" > /dev/null; then
    ls -1 "${STATE_DIR}"/*.done
  else
    echo "(aucun marqueur d'étape)"
  fi
  if [[ -d "${STATE_DIR}/sql_patches" ]]; then
    echo "Patches SQL:"
    ls -1 "${STATE_DIR}/sql_patches" || true
  fi
}

confirm() {
  local prompt="$1"; shift
  if (( CONFIRM )); then return 0; fi
  read -r -p "${prompt} [y/N] " ans || true
  [[ "$ans" == "y" || "$ans" == "Y" ]]
}

delete_phase() {
  local ph="$1"; shift
  local file
  case "$ph" in
    10) file="${STATE_DIR}/10_base_os.done";;
    20) file="${STATE_DIR}/20_web_php.done";;
    30) file="${STATE_DIR}/30_mariadb.done";;
    40) file="${STATE_DIR}/40_radiusdesk_app.done";;
    50) file="${STATE_DIR}/50_freeradius.done";;
    70) file="${STATE_DIR}/70_tls_certbot.done";;
    *) echo "Phase inconnue: $ph" >&2; exit 1;;
  esac
  if [[ -f "$file" ]]; then
    if confirm "Supprimer $file ?"; then
      rm -f "$file"
      echo "Supprimé: $file"
    else
      echo "Annulé."
    fi
  else
    echo "Absent: $file"
  fi
}

delete_all() {
  if compgen -G "${STATE_DIR}/*.done" > /dev/null; then
    if confirm "Supprimer tous les marqueurs dans ${STATE_DIR} ?"; then
      rm -f "${STATE_DIR}"/*.done
      echo "Tous les marqueurs d'étape ont été supprimés."
    else
      echo "Annulé."
    fi
  else
    echo "Aucun marqueur à supprimer dans ${STATE_DIR}."
  fi
}

delete_patches() {
  local d="${STATE_DIR}/sql_patches"
  if [[ -d "$d" ]]; then
    if confirm "Purger les marqueurs de patches SQL dans $d ?"; then
      rm -f "$d"/*.done 2>/dev/null || true
      echo "Patches SQL purgeés."
    else
      echo "Annulé."
    fi
  else
    echo "Aucun répertoire de patches SQL: $d"
  fi
}

if (( DO_LIST )); then
  list_markers
  exit 0
fi

if (( DO_ALL )); then
  delete_all
fi

if [[ -n "$PHASE" ]]; then
  delete_phase "$PHASE"
fi

if (( DO_PATCHES )); then
  delete_patches
fi

if (( ! DO_ALL && ! DO_PATCHES )) && [[ -z "$PHASE" ]]; then
  usage; exit 1
fi

exit 0
