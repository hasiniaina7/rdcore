#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT="${1:-$ROOT_DIR/../omada-captive-portail-exemple.zip}"

echo "Packaging Omada portal into ${OUTPUT}"
rm -f "${OUTPUT}"

(
  cd "${ROOT_DIR}"
  zip -r "${OUTPUT}" . -x "*.DS_Store" "*.zip" "node_modules/*"
)

echo "Bundle ready → ${OUTPUT}"
