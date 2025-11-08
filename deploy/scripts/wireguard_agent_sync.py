#!/usr/bin/env python3
"""
Synchronise WireGuard configuration with RADIUSdesk and push runtime stats.

Reads settings from environment variables (see wireguard-agent.env):
  WG_AGENT_BASE_URL        Base URL to the CakePHP app (default https://127.0.0.1/cake4/rd_cake)
  WG_AGENT_MAC             MAC address registered in RADIUSdesk (aa-bb-cc-dd-ee-ff). If unset, derived
                           from WG_AGENT_INTERFACE with ':' replaced by '-'.
  WG_AGENT_INTERFACE       Interface whose MAC should be used (default: detected default route or eth0).
  WG_AGENT_CONFIG_DIR      Directory for WireGuard configs (default: /etc/wireguard)
  WG_AGENT_SKIP_TLS_VERIFY 1 to skip TLS verification (default: 1)
  WG_AGENT_TIMEOUT         HTTP timeout in seconds (default: 15)
"""

from __future__ import annotations

import argparse
import ipaddress
import json
import os
import pathlib
import re
import ssl
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Dict, List, Optional, Tuple


def env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def detect_default_interface() -> Optional[str]:
    try:
        output = subprocess.check_output(
            ["ip", "route", "get", "1.1.1.1"], text=True
        )
        tokens = output.split()
        if "dev" in tokens:
            idx = tokens.index("dev")
            return tokens[idx + 1]
    except Exception:
        pass
    return None


def read_mac_from_iface(iface: str) -> Optional[str]:
    try:
        mac = pathlib.Path(f"/sys/class/net/{iface}/address").read_text().strip()
    except FileNotFoundError:
        return None
    return mac.replace(":", "-").lower()


def http_request(url: str, data: Optional[bytes], headers: Dict[str, str], verify: bool, timeout: int) -> bytes:
    ctx = None
    if not verify:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, data=data, headers=headers or {})
    with urllib.request.urlopen(req, context=ctx, timeout=timeout) as resp:
        return resp.read()


def build_interface_config(name: str, iface: Dict, peers: List[Dict], filter_cmds: bool = True) -> str:
    def fmt_bool(value):
        if isinstance(value, bool):
            return "true" if value else "false"
        return str(value)

    lines: List[str] = ["[Interface]"]

    optional_keys = ["PrivateKey", "ListenPort", "Address", "MTU", "Table", "SaveConfig"]
    for key in optional_keys:
        if key in iface and iface[key] not in (None, "", []):
            if isinstance(iface[key], list):
                lines.append(f"{key} = {', '.join(str(x) for x in iface[key])}")
            else:
                value = iface[key]
                if isinstance(value, bool):
                    value = fmt_bool(value)
                lines.append(f"{key} = {value}")

    for hook_key in ("PreUp", "PostUp", "PreDown", "PostDown"):
        hook_val = iface.get(hook_key)
        if not hook_val:
            continue
        hooks = hook_val if isinstance(hook_val, list) else [hook_val]
        for cmd in hooks:
            if filter_cmds and not command_available(cmd):
                continue
            lines.append(f"{hook_key} = {cmd}")

    for peer in peers:
        lines.append("")
        lines.append("[Peer]")
        for key in ("PublicKey", "PresharedKey", "AllowedIps", "Endpoint", "PersistentKeepalive"):
            if key not in peer or peer[key] in (None, "", []):
                continue
            value = peer[key]
            if isinstance(value, list):
                value = ", ".join(str(x) for x in value)
            lines.append(f"{key} = {value}")

    lines.append("")
    return "\n".join(lines)


def command_available(command: str) -> bool:
    import shutil

    binary = command.strip().split()[0]
    return shutil.which(binary) is not None


def write_if_changed(path: pathlib.Path, content: str) -> bool:
    if path.exists():
        existing = path.read_text()
        if existing == content:
            return False
    tmp_path = path.with_suffix(".tmp")
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path.write_text(content)
    os.chmod(tmp_path, 0o600)
    tmp_path.replace(path)
    return True


def interface_running(name: str) -> bool:
    return subprocess.run(["wg", "show", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0


def wg_quick(action: str, name: str) -> bool:
    try:
        subprocess.run(["wg-quick", action, name], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        return True
    except subprocess.CalledProcessError as exc:
        print(f"wg-quick {action} {name} failed: {exc}", file=sys.stderr)
        if action == "down":
            subprocess.run(["ip", "link", "delete", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return False
        raise


def collect_stats(instances: List[str]) -> Dict[str, Dict]:
    info: Dict[str, Dict] = {}
    for name in instances:
        try:
            dump = subprocess.check_output(["wg", "show", name, "dump"], text=True)
        except subprocess.CalledProcessError:
            continue
        lines = [line.strip() for line in dump.splitlines() if line.strip()]
        if not lines:
            continue
        iface_fields = lines[0].split("\t")
        if len(iface_fields) < 2:
            continue
        iface_public = iface_fields[1]
        peers = []
        for peer_line in lines[1:]:
            fields = peer_line.split("\t")
            if len(fields) < 8:
                continue
            peer_public = fields[0]
            latest_handshake = int(fields[4]) if fields[4] else 0
            rx_bytes = int(fields[5]) if fields[5] else 0
            tx_bytes = int(fields[6]) if fields[6] else 0
            peers.append(
                {
                    "public_key": peer_public,
                    "latest_handshake": latest_handshake,
                    "rx_bytes": rx_bytes,
                    "tx_bytes": tx_bytes,
                }
            )
        info[name] = {"public_key": iface_public, "peers": peers}
    return info


def parse_networks(addresses: Optional[List[str]]) -> Tuple[Optional[ipaddress._BaseNetwork], Optional[ipaddress._BaseNetwork]]:
    ipv4_net = None
    ipv6_net = None
    if not addresses:
        return ipv4_net, ipv6_net
    for addr in addresses:
        try:
            net = ipaddress.ip_network(addr, strict=False)
        except ValueError:
            continue
        if isinstance(net, ipaddress.IPv4Network) and ipv4_net is None:
            ipv4_net = net
        elif isinstance(net, ipaddress.IPv6Network) and ipv6_net is None:
            ipv6_net = net
    return ipv4_net, ipv6_net


def normalize_interface_hooks(name: str, iface: Dict) -> Dict:
    post_up_raw = iface.get("PostUp") or []
    post_down_raw = iface.get("PostDown") or []
    post_up_list = post_up_raw if isinstance(post_up_raw, list) else [post_up_raw]
    post_down_list = post_down_raw if isinstance(post_down_raw, list) else [post_down_raw]

    cleaned_up: List[str] = []
    cleaned_down: List[str] = []
    nat_requested = False
    uplink = None

    for cmd in post_up_list:
        if not cmd:
            continue
        if isinstance(cmd, str) and ("MASQUERADE" in cmd or "ufw route" in cmd):
            nat_requested = True
            match = re.search(r"out on (\S+)", cmd)
            if match:
                uplink = match.group(1)
            continue
        cleaned_up.append(cmd)

    for cmd in post_down_list:
        if not cmd:
            continue
        if isinstance(cmd, str) and ("MASQUERADE" in cmd or "ufw route" in cmd):
            continue
        cleaned_down.append(cmd)

    if nat_requested and uplink:
        ipv4_net, ipv6_net = parse_networks(iface.get("Address"))
        cleaned_up.append(
            f"sh -c 'iptables -t nat -D POSTROUTING -o {uplink} -j MASQUERADE 2>/dev/null || true'"
        )
        if ipv4_net:
            net = str(ipv4_net)
            cleaned_up.append(
                f"sh -c 'iptables -t nat -C POSTROUTING -o {uplink} -s {net} -j MASQUERADE 2>/dev/null || "
                f"iptables -t nat -A POSTROUTING -o {uplink} -s {net} -j MASQUERADE'"
            )
            cleaned_down.append(
                f"sh -c 'iptables -t nat -D POSTROUTING -o {uplink} -s {net} -j MASQUERADE 2>/dev/null || true'"
            )
        if ipv6_net:
            net6 = str(ipv6_net)
            cleaned_up.append(
                f"sh -c 'ip6tables -t nat -D POSTROUTING -o {uplink} -j MASQUERADE 2>/dev/null || true'"
            )
            cleaned_up.append(
                f"sh -c 'ip6tables -t nat -C POSTROUTING -o {uplink} -s {net6} -j MASQUERADE 2>/dev/null || "
                f"ip6tables -t nat -A POSTROUTING -o {uplink} -s {net6} -j MASQUERADE'"
            )
            cleaned_down.append(
                f"sh -c 'ip6tables -t nat -D POSTROUTING -o {uplink} -s {net6} -j MASQUERADE 2>/dev/null || true'"
            )
        cleaned_up.append(
            f"sh -c 'ufw route delete allow in on {name} out on {uplink} >/dev/null 2>&1; "
            f"ufw route allow in on {name} out on {uplink}'"
        )
        cleaned_down.append(
            f"sh -c 'ufw route delete allow in on {name} out on {uplink} >/dev/null 2>&1 || true'"
        )

    iface["PostUp"] = cleaned_up
    iface["PostDown"] = cleaned_down
    return iface


def sync_once(base_url: str, mac: str, config_dir: pathlib.Path, verify_tls: bool, timeout: int) -> None:
    config_endpoint = f"{base_url.rstrip('/')}/wireguard-servers/get-config-for-server.json?mac={urllib.parse.quote(mac)}"
    report_endpoint = f"{base_url.rstrip('/')}/wireguard-servers/submit-report.json"

    raw = http_request(config_endpoint, None, {}, verify_tls, timeout)
    payload = json.loads(raw)
    instances = payload.get("data") or payload.get("wireguardInstances") or []
    if not instances:
        print("No wireguard instances returned; nothing to do.")
        return

    applied_instances = []
    for instance in instances:
        name = instance["Name"]
        iface_conf = normalize_interface_hooks(name, instance["Interface"])
        peers = instance.get("Peers", [])
        cfg_text = build_interface_config(name, iface_conf, peers)
        conf_path = config_dir / f"{name}.conf"
        changed = write_if_changed(conf_path, cfg_text)
        running = interface_running(name)
        if running and changed:
            print(f"[{name}] configuration changed; restarting interface")
            wg_quick("down", name)
            running = False
        if not running:
            print(f"[{name}] bringing interface up")
            try:
                wg_quick("up", name)
            except subprocess.CalledProcessError:
                # Try a forced delete + second attempt
                subprocess.run(["ip", "link", "delete", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                wg_quick("up", name)
        applied_instances.append(name)

    if not applied_instances:
        print("No interfaces applied.")
        return

    stats = collect_stats(applied_instances)
    if not stats:
        print("No stats collected; skipping report.")
        return

    report_payload = json.dumps({"mac": mac, "info": stats}).encode()
    headers = {"Content-Type": "application/json"}
    http_request(report_endpoint, report_payload, headers, verify_tls, timeout)
    print("Report submitted.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Synchronise WireGuard configuration with RADIUSdesk.")
    parser.add_argument("--base-url", default=os.environ.get("WG_AGENT_BASE_URL", "https://127.0.0.1/cake4/rd_cake"))
    parser.add_argument("--mac", default=os.environ.get("WG_AGENT_MAC"))
    parser.add_argument("--iface", default=os.environ.get("WG_AGENT_INTERFACE"))
    parser.add_argument("--config-dir", default=os.environ.get("WG_AGENT_CONFIG_DIR", "/etc/wireguard"))
    parser.add_argument(
        "--skip-tls-verify",
        action="store_true",
        default=os.environ.get("WG_AGENT_SKIP_TLS_VERIFY", "1") == "1",
        help="Disable HTTPS certificate verification (default: enabled if WG_AGENT_SKIP_TLS_VERIFY!=1)",
    )
    parser.add_argument("--timeout", type=int, default=env_int("WG_AGENT_TIMEOUT", 15))
    args = parser.parse_args()

    iface = args.iface or detect_default_interface() or "eth0"
    mac = args.mac or read_mac_from_iface(iface)
    if not mac:
        print("Unable to determine MAC address; set WG_AGENT_MAC.", file=sys.stderr)
        return 1

    config_dir = pathlib.Path(args.config_dir)
    verify_tls = not args.skip_tls_verify

    try:
        sync_once(args.base_url, mac, config_dir, verify_tls, args.timeout)
    except urllib.error.HTTPError as exc:
        print(f"HTTP error {exc.code}: {exc.read().decode(errors='ignore')}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"WireGuard agent failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
