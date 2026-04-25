import re
from datetime import datetime
from typing import Dict, Optional, Tuple
import logging

from config import config
from ssh_manager import ssh_manager


def validate_ip(ip_address: str) -> bool:
    pattern = r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$"
    if not re.match(pattern, ip_address):
        return False
    parts = ip_address.split(".")
    for part in parts:
        if not 0 <= int(part) <= 255:
            return False
    return True


def validate_mac(mac_address: str) -> bool:
    pattern = r"^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}$"
    return re.match(pattern, mac_address) is not None


def is_pppoe_ip(ip_address: str) -> bool:
    return ip_address.startswith(config.PPPOE_IP_RANGE)


class MikroTikOperations:
    def detect_mikrotik(self, ip_client: str) -> Tuple[Optional[Dict], Optional[str]]:
        if not validate_ip(ip_client):
            return None, "Invalid IP format"

        connection_type = "PPPoE" if is_pppoe_ip(ip_client) else "Hotspot"

        if connection_type == "PPPoE":
            sub_query = (
                "(SELECT nasidentifier FROM radacct "
                f"WHERE framedipaddress = '{ip_client}' "
                "ORDER BY radacctid DESC LIMIT 1)"
            )
        else:
            sub_query = (
                "(SELECT nasidentifier FROM radacct "
                f"WHERE framedipaddress = '{ip_client}' AND acctstoptime IS NULL "
                "ORDER BY acctstarttime DESC LIMIT 1)"
            )

        sql_query = (
            "SELECT nasname, nasidentifier, shortname FROM nas "
            f"WHERE nasname = {sub_query} "
            f"OR shortname = {sub_query} "
            f"OR nasidentifier = {sub_query} "
            "LIMIT 1;"
        )

        cmd = f"sudo mysql -D rd -N -s -e \"{sql_query}\""
        output, error = ssh_manager.run_command(
            config.RADIUS_SSH_HOST,
            config.RADIUS_SSH_USER,
            cmd,
            password=config.RADIUS_SSH_PASSWORD or None,
            pkey_path=config.RADIUS_SSH_KEY_PATH or None,
        )

        if error and not output:
            return None, f"Radius query error: {error}"
        if not output:
            return None, f"No MikroTik found for IP ({connection_type})"

        infos = output.split("\t")
        mkt_ip = infos[0]
        mkt_name = infos[1] if len(infos) > 1 else "Unknown"
        mkt_shortname = infos[2] if len(infos) > 2 else "Unknown"

        return {
            "mikrotik_ip": mkt_ip,
            "mikrotik_name": mkt_name,
            "mikrotik_shortname": mkt_shortname,
            "connection_type": connection_type,
            "ip_client": ip_client,
        }, None

    def _pppoe_client_info(self, ip_mikrotik: str, user: str, password: str, ip_client: str) -> Tuple[Optional[Dict], Optional[str]]:
        # Methode la plus fiable selon tes tests: parse direct de /ppp active print
        cmd_print = f"/ppp active print where address={ip_client}"
        output, _ = ssh_manager.run_command(ip_mikrotik, user, cmd_print, password=password)
        if output:
            for line in output.split("\n"):
                if ip_client in line:
                    # Exemple ligne: "0 R Emmafrancette  pppoe  04:95:E6:54:B5:C8  172.16.4.2  2h32m52s"
                    parts = re.sub(r"\s+", " ", line.strip()).split(" ")
                    mac = None
                    name = None
                    for idx, part in enumerate(parts):
                        if validate_mac(part):
                            mac = part.upper()
                            # nom est souvent juste avant SERVICE, donc au plus proche de la MAC
                            if idx >= 2:
                                name = parts[idx - 2] if parts[idx - 1] in {"pppoe", "pptp", "l2tp", "sstp", "ovpn"} else parts[idx - 1]
                            break
                    if mac:
                        return {
                            "ip": ip_client,
                            "mac": mac,
                            "name": name or "PPPoE Client",
                            "source": "ppp active print",
                        }, None

        cmd_find = f"/ppp active find where address={ip_client}"
        session_id, _ = ssh_manager.run_command(ip_mikrotik, user, cmd_find, password=password)
        session_id = session_id.strip()

        if session_id:
            mac, _ = ssh_manager.run_command(ip_mikrotik, user, f"/ppp active get {session_id} caller-id", password=password)
            name, _ = ssh_manager.run_command(ip_mikrotik, user, f"/ppp active get {session_id} name", password=password)
            if validate_mac(mac.strip()):
                return {
                    "ip": ip_client,
                    "mac": mac.strip().upper(),
                    "name": name.strip() or "PPPoE Client",
                    "source": "ppp active",
                }, None
            if session_id and not mac.strip():
                return None, "PPPoE session found but caller-id is empty"

        cmd_secret = f"/ppp secret find where remote-address={ip_client}"
        secret_id, _ = ssh_manager.run_command(ip_mikrotik, user, cmd_secret, password=password)
        secret_id = secret_id.strip()
        if secret_id:
            mac, _ = ssh_manager.run_command(ip_mikrotik, user, f"/ppp secret get {secret_id} caller-id", password=password)
            name, _ = ssh_manager.run_command(ip_mikrotik, user, f"/ppp secret get {secret_id} name", password=password)
            if validate_mac(mac.strip()):
                return {
                    "ip": ip_client,
                    "mac": mac.strip().upper(),
                    "name": name.strip() or "PPPoE Client",
                    "source": "ppp secret",
                }, None
            if secret_id and not mac.strip():
                return None, "PPPoE secret found but caller-id is empty"

        return None, "PPPoE client not found (active/secret)"

    def _hotspot_client_info(self, ip_mikrotik: str, user: str, password: str, ip_client: str) -> Tuple[Optional[Dict], Optional[str]]:
        logging.info(f"Hotspot client info: Starting for IP {ip_client} on MikroTik {ip_mikrotik}")
        # First, try to find an active hotspot session to get the logged-in username
        cmd_find_active = "/ip hotspot active print"
        logging.info(f"Hotspot client info: Running command '{cmd_find_active}'")
        output, error = ssh_manager.run_command(ip_mikrotik, user, cmd_find_active, password=password)
        if error:
            logging.warning(f"Hotspot client info: Command failed with error: {error}")
        logging.info(f"Hotspot client info: Command output length: {len(output) if output else 0}")
        session_id = None
        user_name = ""
        if output:
            lines = output.strip().split('\n')
            logging.info(f"Hotspot client info: Parsing {len(lines)} lines")
            for line in lines:
                line = line.strip()
                if line and line[0].isdigit():  # Data line starts with ID
                    parts = line.split()
                    logging.debug(f"Hotspot client info: Checking line: {line}")
                    try:
                        addr_index = parts.index(ip_client)
                        if addr_index >= 3:  # Ensure enough fields
                            session_id = parts[0]
                            user_parts = parts[1:addr_index-1]
                            user_name = ' '.join(user_parts)
                            logging.info(f"Hotspot client info: Found session ID {session_id}, user '{user_name}' for IP {ip_client}")
                            break
                    except ValueError:
                        continue
        else:
            logging.info("Hotspot client info: No output from active print command")

        if session_id:
            logging.info(f"Hotspot client info: Session found, getting MAC for {ip_client}")
            # Get MAC from host table
            cmd_get_mac = (
                f":local h [/ip hotspot host find to-address={ip_client}]; "
                ":if ([:len $h] > 0) do={"
                ":local hostMAC [/ip hotspot host get $h mac-address];"
                ":put ($hostMAC)"
                "}"
            )
            mac_output, error = ssh_manager.run_command(ip_mikrotik, user, cmd_get_mac, password=password)
            if error:
                logging.warning(f"Hotspot client info: MAC command failed: {error}")
            mac = mac_output.strip() if mac_output else ""
            logging.info(f"Hotspot client info: MAC retrieved: '{mac}'")
            if validate_mac(mac):
                logging.info(f"Hotspot client info: Valid MAC, returning client info")
                return {
                    "ip": ip_client,
                    "mac": mac.upper(),
                    "name": user_name.strip() or "Hotspot Client",
                    "source": "hotspot active",
                }, None
            else:
                logging.warning(f"Hotspot client info: Invalid MAC '{mac}', falling back")

        logging.info("Hotspot client info: No active session or invalid MAC, trying fallback to host table")
        # Fallback to host table if no active session is found
        cmd = (
            f":local h [/ip hotspot host find to-address={ip_client}]; "
            ":if ([:len $h] > 0) do={"
            ":local hostIP [/ip hotspot host get $h address];"
            ":local hostMAC [/ip hotspot host get $h mac-address];"
            ":local hostName [/ip hotspot host get $h comment];"
            ":put (\"$hostIP,$hostMAC,$hostName\")"
            "}"
        )
        output, error = ssh_manager.run_command(ip_mikrotik, user, cmd, password=password)
        if error:
            logging.warning(f"Hotspot client info: Host fallback command failed: {error}")
        if output and "," in output:
            parts = output.split(",")
            if len(parts) >= 2 and validate_mac(parts[1].strip()):
                logging.info(f"Hotspot client info: Host fallback successful, MAC: {parts[1].strip()}")
                return {
                    "ip": parts[0].strip(),
                    "mac": parts[1].strip().upper(),
                    "name": parts[2].strip() if len(parts) > 2 and parts[2].strip() else "Hotspot Client",
                    "source": "hotspot host",
                }, None

        logging.info("Hotspot client info: Host fallback failed, trying print command")
        cmd_alt = f"/ip hotspot host print where address={ip_client}"
        output, error = ssh_manager.run_command(ip_mikrotik, user, cmd_alt, password=password)
        if error:
            logging.warning(f"Hotspot client info: Print command failed: {error}")
        mac_match = re.search(r"mac-address=([0-9A-Fa-f:]{17})", output, re.IGNORECASE)
        comment_match = re.search(r"comment=\"?([^\"\n]+)\"?", output)
        if mac_match:
            logging.info(f"Hotspot client info: Print command successful, MAC: {mac_match.group(1)}")
            return {
                "ip": ip_client,
                "mac": mac_match.group(1).upper(),
                "name": comment_match.group(1).strip() if comment_match else "Hotspot Client",
                "source": "hotspot print",
            }, None

        logging.info("Hotspot client info: All methods failed, client not found")
        return None, "Hotspot client not found"

    def get_client_info(
        self,
        ip_mikrotik: str,
        user: str,
        password: str,
        ip_client: str,
        connection_type: str,
    ) -> Tuple[Optional[Dict], Optional[str]]:
        if not validate_ip(ip_client):
            return None, "Invalid IP format"
        if not validate_ip(ip_mikrotik):
            return None, "Invalid MikroTik IP format"

        if connection_type == "PPPoE":
            return self._pppoe_client_info(ip_mikrotik, user, password, ip_client)
        return self._hotspot_client_info(ip_mikrotik, user, password, ip_client)

    def test_connection(self, ip_mikrotik: str, user: str, password: str) -> Tuple[bool, str]:
        output, error = ssh_manager.run_command(ip_mikrotik, user, "/system resource print", password=password)
        if output:
            return True, "OK"
        return False, error or "Unknown error"

    def check_existing_bypass(self, ip_mikrotik: str, user: str, password: str, mac: str) -> bool:
        output, _ = ssh_manager.run_command(
            ip_mikrotik, user, f"/ip hotspot ip-binding print where mac-address={mac}", password=password
        )
        return mac.lower() in output.lower() and "bypassed" in output.lower()

    def activate_bypass(self, ip_mikrotik: str, user: str, password: str, mac: str, ip_client: str, client_name: str) -> Tuple[bool, str, Optional[Dict]]:
        if not validate_mac(mac):
            return False, "Invalid MAC format", None

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        comment = f"SUPPORT_{timestamp}_{client_name[:20]}_{ip_client}"

        existing = self.check_existing_bypass(ip_mikrotik, user, password, mac)
        if existing:
            ssh_manager.run_command(ip_mikrotik, user, f"/ip hotspot ip-binding remove [find mac-address={mac}]", password=password)

        cmd_add = f"/ip hotspot ip-binding add mac-address={mac} type=bypassed comment=\"{comment}\" disabled=no"
        _, error = ssh_manager.run_command(ip_mikrotik, user, cmd_add, password=password)
        if error:
            return False, error, None

        verify, _ = ssh_manager.run_command(ip_mikrotik, user, f"/ip hotspot ip-binding print where mac-address={mac}", password=password)
        if mac.lower() in verify.lower() and "bypassed" in verify.lower():
            return True, "Bypass activated", {"comment": comment}

        return False, "Failed to activate bypass", None

    def deactivate_bypass(self, ip_mikrotik: str, user: str, password: str, mac: str) -> Tuple[bool, str, Optional[int]]:
        if not validate_mac(mac):
            return False, "Invalid MAC format", None

        output, _ = ssh_manager.run_command(ip_mikrotik, user, f"/ip hotspot ip-binding print where mac-address={mac}", password=password)
        lines = [line for line in output.split("\n") if mac.lower() in line.lower()]
        count = len(lines)

        ssh_manager.run_command(ip_mikrotik, user, f"/ip hotspot ip-binding remove [find mac-address={mac}]", password=password)
        verify, _ = ssh_manager.run_command(ip_mikrotik, user, f"/ip hotspot ip-binding print where mac-address={mac}", password=password)

        if mac.lower() not in verify.lower():
            return True, "Bypass removed", count

        return False, "Failed to remove bypass", count


operations = MikroTikOperations()
