import threading
import time
from typing import Optional, Tuple

import paramiko

from config import config


class SSHManager:
    def __init__(self) -> None:
        self._local = threading.local()

    def _get_pool(self) -> dict:
        pool = getattr(self._local, "pool", None)
        if pool is None:
            pool = {}
            self._local.pool = pool
        return pool

    def _make_key(self, host: str, username: str, pkey_path: Optional[str]) -> str:
        return f"{host}|{username}|{pkey_path or ''}"

    def _create_client(self, host: str, username: str, password: Optional[str], pkey_path: Optional[str]) -> paramiko.SSHClient:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        kwargs = {
            "hostname": host,
            "username": username,
            "timeout": config.SSH_CONNECT_TIMEOUT,
            "look_for_keys": False,
            "allow_agent": False,
        }
        if pkey_path:
            key = paramiko.RSAKey.from_private_key_file(pkey_path)
            kwargs["pkey"] = key
        else:
            kwargs["password"] = password
        client.connect(**kwargs)
        return client

    def get_client(self, host: str, username: str, password: Optional[str] = None, pkey_path: Optional[str] = None) -> paramiko.SSHClient:
        pool = self._get_pool()
        key = self._make_key(host, username, pkey_path)
        client = pool.get(key)
        if client is not None and client.get_transport() and client.get_transport().is_active():
            return client
        client = self._create_client(host, username, password, pkey_path)
        pool[key] = client
        return client

    def close_all(self) -> None:
        pool = self._get_pool()
        for client in list(pool.values()):
            try:
                client.close()
            except Exception:
                pass
        pool.clear()

    def run_command(
        self,
        host: str,
        username: str,
        command: str,
        password: Optional[str] = None,
        pkey_path: Optional[str] = None,
    ) -> Tuple[str, str]:
        last_error = ""
        for attempt in range(config.SSH_RETRIES + 1):
            try:
                client = self.get_client(host, username, password=password, pkey_path=pkey_path)
                stdin, stdout, stderr = client.exec_command(command, timeout=config.SSH_COMMAND_TIMEOUT)
                output = stdout.read().decode(errors="ignore").strip()
                error = stderr.read().decode(errors="ignore").strip()
                return output, error
            except Exception as exc:
                last_error = str(exc)
                try:
                    self.close_all()
                except Exception:
                    pass
                if attempt < config.SSH_RETRIES:
                    time.sleep(1 + attempt)
                    continue
                return "", last_error
        return "", last_error


ssh_manager = SSHManager()
