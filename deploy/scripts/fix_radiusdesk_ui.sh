#!/usr/bin/env bash
# Script centralisé pour lancer les correctifs UI (/OTHER + logos)

set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RUN_OTHER="${RUN_OTHER_FIX:-1}"
RUN_LOGO="${RUN_LOGO_FIX:-1}"

if [[ "${RUN_OTHER}" -eq 1 ]]; then
  "${BASE_DIR}/scripts/fix_radiusdesk_other.sh"
fi

if [[ "${RUN_LOGO}" -eq 1 ]]; then
  "${BASE_DIR}/scripts/fix_radiusdesk_logos.sh"
fi
