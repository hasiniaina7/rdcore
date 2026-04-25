import json
import logging
import os
import threading
import time
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

load_dotenv()

from config import config
from mikrotik_operations import operations, validate_ip, validate_mac
from db import create_intervention, finish_intervention, init_db, list_interventions


app = Flask(__name__)
app.config["SECRET_KEY"] = config.SECRET_KEY

CORS(app, resources={r"/api/*": {"origins": config.CORS_ORIGINS.split(",")}})

os.makedirs(os.path.dirname(config.LOG_FILE), exist_ok=True)
os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)
init_db()

logger = logging.getLogger("maintenance")
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler(config.LOG_FILE, encoding="utf-8")
file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
logger.addHandler(file_handler)


class MemoryLogHandler(logging.Handler):
    def __init__(self, max_entries: int = 500) -> None:
        super().__init__()
        self.max_entries = max_entries
        self.entries = []
        self._lock = threading.Lock()

    def emit(self, record: logging.LogRecord) -> None:
        entry = self.format(record)
        with self._lock:
            self.entries.append(entry)
            if len(self.entries) > self.max_entries:
                self.entries = self.entries[-self.max_entries :]

    def get_entries(self) -> list:
        with self._lock:
            return list(self.entries)


memory_handler = MemoryLogHandler()
memory_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
logger.addHandler(memory_handler)


sessions: Dict[str, Dict[str, Any]] = {}
sessions_lock = threading.Lock()


def _now() -> datetime:
    return datetime.utcnow()


def _new_session() -> Dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "created_at": _now().isoformat(),
        "updated_at": _now().isoformat(),
        "state": "idle",
        "error": None,
        "data": {},
        "maintenance_active": False,
        "maintenance_started_at": None,
    }


def _get_session(session_id: Optional[str]) -> Dict[str, Any]:
    if session_id is None:
        session = _new_session()
        with sessions_lock:
            sessions[session["id"]] = session
        return session

    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            session = _new_session()
            sessions[session["id"]] = session
        return session


def _update_session(session_id: str, **updates: Any) -> Dict[str, Any]:
    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            session = _new_session()
            sessions[session["id"]] = session
        session.update(updates)
        session["updated_at"] = _now().isoformat()
        return session


def _cleanup_sessions() -> None:
    ttl = timedelta(minutes=config.SESSION_TTL_MINUTES)
    while True:
        time.sleep(60)
        cutoff = _now() - ttl
        with sessions_lock:
            expired = [sid for sid, s in sessions.items() if datetime.fromisoformat(s["updated_at"]) < cutoff]
            for sid in expired:
                sessions.pop(sid, None)


cleanup_thread = threading.Thread(target=_cleanup_sessions, daemon=True)
cleanup_thread.start()


def _response(session: Dict[str, Any], status: str = "ok", message: Optional[str] = None, extra: Optional[Dict[str, Any]] = None):
    payload = {
        "status": status,
        "message": message,
        "session": session,
    }
    if extra:
        payload.update(extra)
    return jsonify(payload)


def _log_event(message: str, level: str = "info") -> None:
    if level == "error":
        logger.error(message)
    elif level == "warning":
        logger.warning(message)
    else:
        logger.info(message)


def _require_json() -> Dict[str, Any]:
    if not request.is_json:
        return {}
    return request.get_json(silent=True) or {}


def _require_fields(data: Dict[str, Any], fields: list) -> Optional[str]:
    missing = [field for field in fields if not data.get(field)]
    if missing:
        return f"Missing fields: {', '.join(missing)}"
    return None


def _background(target, *args, **kwargs):
    thread = threading.Thread(target=target, args=args, kwargs=kwargs, daemon=True)
    thread.start()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/detect-mikrotik", methods=["POST"])
def detect_mikrotik():
    data = _require_json()
    error = _require_fields(data, ["ip_client"])
    if error:
        return _response(_get_session(data.get("session_id")), "error", error), 400

    ip_client = data["ip_client"].strip()
    if not validate_ip(ip_client):
        return _response(_get_session(data.get("session_id")), "error", "Invalid IP format"), 400

    session = _get_session(data.get("session_id"))
    _update_session(session["id"], state="detecting", error=None, data={"ip_client": ip_client})
    _log_event(f"Detect MikroTik requested for {ip_client}")

    def worker(session_id: str):
        result, err = operations.detect_mikrotik(ip_client)
        if err:
            _update_session(session_id, state="error", error=err)
            _log_event(err, "error")
            return
        _update_session(session_id, state="detected", data={**result})
        _log_event(f"MikroTik detected: {result['mikrotik_ip']} ({result['connection_type']})")

    _background(worker, session["id"])
    return _response(_get_session(session["id"]), message="Detection started")


@app.route("/api/get-client-info", methods=["POST"])
def get_client_info():
    data = _require_json()
    session = _get_session(data.get("session_id"))
    session_data = session.get("data", {})

    ip_client = (data.get("ip_client") or session_data.get("ip_client") or "").strip()
    mikrotik_ip = (data.get("mikrotik_ip") or session_data.get("mikrotik_ip") or "").strip()
    connection_type = (data.get("connection_type") or session_data.get("connection_type") or "").strip()

    error = _require_fields(
        {"ip_client": ip_client, "mikrotik_ip": mikrotik_ip, "connection_type": connection_type},
        ["ip_client", "mikrotik_ip", "connection_type"],
    )
    if error:
        return _response(session, "error", error), 400

    _update_session(session["id"], state="fetching_client", error=None)

    def worker(session_id: str):
        ok, msg = operations.test_connection(mikrotik_ip, config.MIKROTIK_USER, config.MIKROTIK_PASSWORD)
        if not ok:
            error_msg = f"Connexion SSH au MikroTik échouée: {msg}"
            _update_session(session_id, state="error", error=error_msg)
            _log_event(error_msg, "error")
            return
        result, err = operations.get_client_info(
            mikrotik_ip,
            config.MIKROTIK_USER,
            config.MIKROTIK_PASSWORD,
            ip_client,
            connection_type,
        )
        if err:
            _update_session(session_id, state="error", error=err)
            _log_event(err, "error")
            return
        current = _get_session(session_id)
        _update_session(session_id, state="client_ready", data={**current.get("data", {}), "client": result})
        _log_event(f"Client info loaded for {ip_client}")

    _background(worker, session["id"])
    return _response(_get_session(session["id"]), message="Client lookup started")


@app.route("/api/activate-bypass", methods=["POST"])
def activate_bypass():
    data = _require_json()
    session = _get_session(data.get("session_id"))
    session_data = session.get("data", {})

    mikrotik_ip = (data.get("mikrotik_ip") or session_data.get("mikrotik_ip") or "").strip()
    ip_client = (data.get("ip_client") or session_data.get("ip_client") or "").strip()
    client_name = (data.get("client_name") or (session_data.get("client") or {}).get("name") or "Client").strip()
    mac = (data.get("mac") or (session_data.get("client") or {}).get("mac") or "").strip()

    error = _require_fields(
        {"mikrotik_ip": mikrotik_ip, "ip_client": ip_client, "client_name": client_name, "mac": mac},
        ["mikrotik_ip", "ip_client", "client_name", "mac"],
    )
    if error:
        return _response(session, "error", error), 400

    if not validate_mac(mac):
        return _response(session, "error", "Invalid MAC format"), 400

    _update_session(session["id"], state="activating", error=None)

    def worker(session_id: str):
        ok, msg, meta = operations.activate_bypass(
            mikrotik_ip,
            config.MIKROTIK_USER,
            config.MIKROTIK_PASSWORD,
            mac,
            ip_client,
            client_name,
        )
        if not ok:
            _update_session(session_id, state="error", error=msg)
            _log_event(msg, "error")
            return
        current = _get_session(session_id)
        create_intervention(
            {
                "session_id": session_id,
                "ip_client": ip_client,
                "mikrotik_ip": mikrotik_ip,
                "connection_type": current.get("data", {}).get("connection_type"),
                "mac": mac,
                "client_name": client_name,
                "bypass_comment": (meta or {}).get("comment"),
                "status": "active",
            }
        )
        _update_session(
            session_id,
            state="active",
            maintenance_active=True,
            maintenance_started_at=_now().isoformat(),
            data={**current.get("data", {}), "bypass": meta or {}},
        )
        _log_event(f"Bypass activated for {mac}")

    _background(worker, session["id"])
    return _response(_get_session(session["id"]), message="Activation started")


@app.route("/api/deactivate-bypass", methods=["POST"])
def deactivate_bypass():
    data = _require_json()
    session = _get_session(data.get("session_id"))
    session_data = session.get("data", {})

    mikrotik_ip = (data.get("mikrotik_ip") or session_data.get("mikrotik_ip") or "").strip()
    mac = (data.get("mac") or (session_data.get("client") or {}).get("mac") or "").strip()

    error = _require_fields({"mikrotik_ip": mikrotik_ip, "mac": mac}, ["mikrotik_ip", "mac"])
    if error:
        return _response(session, "error", error), 400

    _update_session(session["id"], state="deactivating", error=None)

    def worker(session_id: str):
        ok, msg, count = operations.deactivate_bypass(
            mikrotik_ip,
            config.MIKROTIK_USER,
            config.MIKROTIK_PASSWORD,
            mac,
        )
        if not ok:
            _update_session(session_id, state="error", error=msg)
            _log_event(msg, "error")
            return
        finish_intervention(session_id, mac, "completed")
        current = _get_session(session_id)
        _update_session(
            session_id,
            state="completed",
            maintenance_active=False,
            maintenance_started_at=None,
            data={**current.get("data", {}), "removed": count or 0},
        )
        _log_event(f"Bypass removed for {mac}")

    _background(worker, session["id"])
    return _response(_get_session(session["id"]), message="Deactivation started")


@app.route("/api/finish-maintenance", methods=["POST"])
def finish_maintenance():
    return deactivate_bypass()


@app.route("/api/maintenance-status", methods=["GET"])
def maintenance_status():
    session_id = request.args.get("session_id")
    session = _get_session(session_id)
    return _response(session)


@app.route("/api/logs", methods=["GET"])
def get_logs():
    entries = memory_handler.get_entries()
    return jsonify({"status": "ok", "logs": entries[-200:]})


@app.route("/api/interventions", methods=["GET"])
def get_interventions():
    limit = request.args.get("limit", "200")
    try:
        limit_value = max(1, min(500, int(limit)))
    except ValueError:
        limit_value = 200
    return jsonify({"status": "ok", "data": list_interventions(limit_value)})


@app.errorhandler(Exception)
def handle_error(err):
    if isinstance(err, HTTPException):
        return err
    logger.exception("Unhandled error")
    session_id = None
    if request.is_json:
        session_id = (request.get_json(silent=True) or {}).get("session_id")
    session = _get_session(session_id)
    _update_session(session["id"], state="error", error=str(err))
    return _response(session, "error", str(err)), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=config.DEBUG)
