import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

from config import config


def _connect():
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS interventions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                ip_client TEXT,
                mikrotik_ip TEXT,
                connection_type TEXT,
                mac TEXT,
                client_name TEXT,
                bypass_comment TEXT,
                status TEXT,
                error TEXT,
                started_at TEXT,
                finished_at TEXT
            )
            """
        )
        conn.commit()


def create_intervention(payload: Dict[str, Any]) -> int:
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO interventions (
                session_id, ip_client, mikrotik_ip, connection_type, mac, client_name,
                bypass_comment, status, error, started_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.get("session_id"),
                payload.get("ip_client"),
                payload.get("mikrotik_ip"),
                payload.get("connection_type"),
                payload.get("mac"),
                payload.get("client_name"),
                payload.get("bypass_comment"),
                payload.get("status"),
                payload.get("error"),
                payload.get("started_at") or datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        return int(cur.lastrowid)


def finish_intervention(session_id: str, mac: str, status: str, error: Optional[str] = None) -> None:
    with _connect() as conn:
        conn.execute(
            """
            UPDATE interventions
            SET status = ?, error = ?, finished_at = ?
            WHERE session_id = ? AND mac = ? AND finished_at IS NULL
            """,
            (status, error, datetime.utcnow().isoformat(), session_id, mac),
        )
        conn.commit()


def list_interventions(limit: int = 200) -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT * FROM interventions
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]
