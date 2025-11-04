#!/usr/bin/env bash
# TESTÉ sur Ubuntu 24.04 : en cours de validation (2025-11-03)
set -euo pipefail
IFS=$'\n\t'

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <prefix_numerique> (ex: 10, 20, 40)" >&2
  exit 1
fi

PHASE="$1"
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_PATTERN="${BASE_DIR}/scripts/${PHASE}_*.sh"

shopt -s nullglob
SCRIPTS=( ${SCRIPT_PATTERN} )
shopt -u nullglob

if [[ ${#SCRIPTS[@]} -eq 0 ]]; then
  echo "Aucun script ne correspond à ${SCRIPT_PATTERN}" >&2
  exit 1
fi

for s in "${SCRIPTS[@]}"; do
  echo ">> Exécution ${s}"
  "${s}"
done
