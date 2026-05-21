#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 6 ]]; then
  cat <<'USAGE'
Usage:
  send_radius_disconnect.sh <coa|disconnect> <nas_ip> <secret> <username> <calling_station_id> <acct_session_id> [nas_port]

Examples:
  send_radius_disconnect.sh disconnect 10.0.0.2 'sharedSecret' user01 AA-BB-CC-DD-EE-FF A1B2C3
  send_radius_disconnect.sh coa 10.0.0.2 'sharedSecret' user01 AA-BB-CC-DD-EE-FF A1B2C3 12
USAGE
  exit 1
fi

MODE="$1"
NAS_IP="$2"
SECRET="$3"
USERNAME="$4"
CALLING_STATION_ID="$5"
ACCT_SESSION_ID="$6"
NAS_PORT="${7:-}"

case "$MODE" in
  coa) CODE="coa" ;;
  disconnect) CODE="disconnect" ;;
  *) echo "Invalid mode: $MODE"; exit 2 ;;
esac

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

{
  echo "User-Name = \"$USERNAME\""
  echo "Calling-Station-Id = \"$CALLING_STATION_ID\""
  echo "Acct-Session-Id = \"$ACCT_SESSION_ID\""
  [[ -n "$NAS_PORT" ]] && echo "NAS-Port = $NAS_PORT"
  echo "Message-Authenticator = 0x00"
} > "$TMP_FILE"

echo "Sending $CODE request to ${NAS_IP}:3799"
radclient -x "${NAS_IP}:3799" "$CODE" "$SECRET" < "$TMP_FILE"
