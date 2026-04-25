import os


def _get_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    DEBUG = _get_bool("DEBUG", False)

    # MikroTik and Radius defaults
    MIKROTIK_USER = os.getenv("MIKROTIK_USER", "admin")
    MIKROTIK_PASSWORD = os.getenv("MIKROTIK_PASSWORD", "")

    RADIUS_SSH_HOST = os.getenv("RADIUS_SSH_HOST", "10.5.1.1")
    RADIUS_SSH_USER = os.getenv("RADIUS_SSH_USER", "ubuntu")
    RADIUS_SSH_KEY_PATH = os.getenv("RADIUS_SSH_KEY_PATH", "")
    RADIUS_SSH_PASSWORD = os.getenv("RADIUS_SSH_PASSWORD", "")

    PPPOE_IP_RANGE = os.getenv("PPPOE_IP_RANGE", "172.16.")

    SSH_CONNECT_TIMEOUT = int(os.getenv("SSH_CONNECT_TIMEOUT", "12"))
    SSH_COMMAND_TIMEOUT = int(os.getenv("SSH_COMMAND_TIMEOUT", "15"))
    SSH_RETRIES = int(os.getenv("SSH_RETRIES", "2"))

    SESSION_TTL_MINUTES = int(os.getenv("SESSION_TTL_MINUTES", "30"))

    LOG_FILE = os.getenv("LOG_FILE", "logs/maintenance.log")
    DB_PATH = os.getenv("DB_PATH", "data/interventions.db")

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")


config = Config()
