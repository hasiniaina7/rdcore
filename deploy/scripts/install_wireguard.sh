#!/usr/bin/env bash
# Installe une base WireGuard + l'agent RADIUSdesk
# - packages + forwarding
# - agent systemd (timer) pour synchroniser les interfaces définies dans le GUI

set -euo pipefail
IFS=$'\n\t'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "${BASE_DIR}/config/env.sh"
source "${BASE_DIR}/lib/common.sh"

CURRENT_LOG="${LOG_DIR}/wireguard_install.log"

require_root

WG_KEY_DIR="${WG_KEY_DIR:-/var/lib/radiusdesk/wireguard}"
WG_CONF_DIR="/etc/wireguard"
WG_STATE_MARK="${STATE_DIR}/wireguard_base.done"
AGENT_BIN="/usr/local/sbin/radiusdesk-wireguard-agent"
AGENT_ENV="/etc/radiusdesk/wireguard-agent.env"
SYSTEMD_DIR="/etc/systemd/system"

log INFO "=== Installation WireGuard pour RADIUSdesk ==="

install_packages() {
  log INFO "Installation des paquets WireGuard"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y wireguard wireguard-tools qrencode
}

enable_kernel_module() {
  if ! lsmod | grep -q '^wireguard'; then
    modprobe wireguard || true
  fi
  echo "wireguard" > /etc/modules-load.d/wireguard.conf
}

enable_ip_forwarding() {
  local sysctl_file="/etc/sysctl.d/90-wireguard.conf"
  cat > "${sysctl_file}" <<EOF
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1
EOF
  sysctl --system >/dev/null
}

install_agent() {
  log INFO "Installation de l'agent WireGuard"
  install -D -m 0755 "${BASE_DIR}/scripts/wireguard_agent_sync.py" "${AGENT_BIN}"
}

create_env_file() {
  local def_iface
  def_iface="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if ($i=="dev") {print $(i+1); exit}}')"
  if [[ -z "${def_iface}" ]]; then
    def_iface="eth0"
  fi
  local def_mac=""
  if [[ -f "/sys/class/net/${def_iface}/address" ]]; then
    def_mac=$(tr ':' '-' < "/sys/class/net/${def_iface}/address")
  fi
  mkdir -p "$(dirname "${AGENT_ENV}")"
  cat > "${AGENT_ENV}" <<EOF
# Base URL du backend CakePHP (adapter si reverse-proxy)
WG_AGENT_BASE_URL=${WG_AGENT_BASE_URL:-http://127.0.0.1/cake4/rd_cake}
# Interface à utiliser pour dériver la MAC (peut être surchargée)
WG_AGENT_INTERFACE=${WG_AGENT_INTERFACE:-${def_iface}}
# MAC enregistrée dans Wireguard Servers (format aa-bb-cc-dd-ee-ff)
WG_AGENT_MAC=${WG_AGENT_MAC:-${def_mac}}
# 1 = ignorer la vérification TLS (par défaut)
WG_AGENT_SKIP_TLS_VERIFY=${WG_AGENT_SKIP_TLS_VERIFY:-1}
EOF
  chmod 600 "${AGENT_ENV}"
}

install_units() {
  local svc="${SYSTEMD_DIR}/radiusdesk-wireguard-agent.service"
  local timer="${SYSTEMD_DIR}/radiusdesk-wireguard-agent.timer"
  cat > "${svc}" <<EOF
[Unit]
Description=RADIUSdesk WireGuard agent
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
EnvironmentFile=-${AGENT_ENV}
ExecStart=${AGENT_BIN}

[Install]
WantedBy=multi-user.target
EOF

  cat > "${timer}" <<EOF
[Unit]
Description=Synchronise WireGuard instances via RADIUSdesk

[Timer]
OnBootSec=30s
OnUnitActiveSec=60s
AccuracySec=10s
Unit=radiusdesk-wireguard-agent.service

[Install]
WantedBy=timers.target
EOF

  systemctl daemon-reload
  systemctl enable --now radiusdesk-wireguard-agent.timer
}

install_cake_stub() {
  local helper="/usr/local/sbin/cake-wg.sh"
  if [[ -x "${helper}" ]]; then
    return
  fi
  cat > "${helper}" <<'EOF'
#!/usr/bin/env bash
# Placeholder script for SQM hooks référencés dans RADIUSdesk
set -euo pipefail
LOG_DIR="/var/log/radiusdesk-install"
mkdir -p "${LOG_DIR}"
echo "$(date -Is) $0 $*" >> "${LOG_DIR}/cake-wg.log"
EOF
  chmod 0755 "${helper}"
}

configure_firewall() {
  log INFO "Configuration du routage firewall (UFW)"
  export DEBIAN_FRONTEND=noninteractive
  apt-get install -y ufw >/dev/null
  local status
  status="$(ufw status 2>/dev/null | head -n1 || true)"
  if [[ "${status}" == "Status: inactive" || "${status}" == "" ]]; then
    ufw --force reset >/dev/null
    ufw default allow incoming >/dev/null
    ufw default allow outgoing >/dev/null
    ufw --force enable >/dev/null
  fi
  if grep -q '^DEFAULT_FORWARD_POLICY=' /etc/default/ufw; then
    sed -i 's/^DEFAULT_FORWARD_POLICY=.*/DEFAULT_FORWARD_POLICY="DROP"/' /etc/default/ufw
  else
    echo 'DEFAULT_FORWARD_POLICY="DROP"' >> /etc/default/ufw
  fi
  ufw --force reload >/dev/null
}

allow_wg_internal_routes() {
  log INFO "Autorisation du trafic wgX -> wgX (iptables/ufw)"
  if ! iptables -C FORWARD -i wg+ -o wg+ -j ACCEPT >/dev/null 2>&1; then
    iptables -I FORWARD -i wg+ -o wg+ -j ACCEPT
  fi
  if ! ip6tables -C FORWARD -i wg+ -o wg+ -j ACCEPT >/dev/null 2>&1; then
    ip6tables -I FORWARD -i wg+ -o wg+ -j ACCEPT
  fi
}

drop_metadata() {
  mkdir -p "${STATE_DIR}"
  cat > "${WG_STATE_MARK}" <<EOF
packages=wireguard wireguard-tools
agent=${AGENT_BIN}
timer=radiusdesk-wireguard-agent.timer
EOF
}

summary() {
  log INFO "WireGuard packages installés. Vérifiez ${AGENT_ENV} et remplissez la MAC correspondant au serveur."
  log INFO "L'agent systemd (radiusdesk-wireguard-agent.timer) rafraîchira les interfaces définies dans le GUI."
}

install_packages
enable_kernel_module
enable_ip_forwarding
install_agent
create_env_file
install_units
install_cake_stub
configure_firewall
allow_wg_internal_routes
drop_metadata
summary

log INFO "=== Installation WireGuard terminée ==="
