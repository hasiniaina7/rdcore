import React, { useEffect, useMemo, useState } from "react";
import { SessionList } from "../types";
import { combineSessions } from "../utils";

type Props = {
  title: string;
  list: SessionList;
  canDisconnect?: boolean;
  onDisconnect?: (ids: number[]) => void;
};

export function SessionsTableCard({ title, list, canDisconnect, onDisconnect }: Props) {
  const rows = useMemo(() => combineSessions(list), [list]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSelected({});
  }, [list.username, list.totalCount, list.sessions.length]);

  const toggle = (id: number) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const selectedIds = Object.entries(selected)
    .filter(([, checked]) => checked)
    .map(([id]) => Number(id));

  return (
    <div className="ic-card">
      <div className="ic-card-header">
        <div className="ic-card-title">{title}</div>
        <span className="ic-badge muted">{list.totalCount} session(s)</span>
      </div>

      {rows.length === 0 ? (
        <div className="ic-empty">Aucune session.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="ic-table">
            <thead>
              <tr>
                {canDisconnect && <th style={{ width: 48 }}>Sel.</th>}
                <th>Base Wifi</th>
                <th>IP</th>
                <th>Début</th>
                <th>Durée</th>
                <th>Données</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {canDisconnect && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner la session ${row.id}`}
                        checked={!!selected[row.id]}
                        onChange={() => toggle(row.id)}
                      />
                    </td>
                  )}
                  <td>{row.nas}</td>
                  <td>{row.ip}</td>
                  <td>{row.start}</td>
                  <td>{row.duration}</td>
                  <td>{row.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canDisconnect && rows.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="ic-button"
            style={{ background: "var(--ic-danger)", boxShadow: "none" }}
            disabled={selectedIds.length === 0}
            onClick={() => onDisconnect?.(selectedIds)}
          >
            Déconnecter {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </button>
          <span className="ic-helper" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
            Déconnecter une session peut interrompre la connexion en cours et nécessiter une reconnexion.
          </span>
        </div>
      )}
    </div>
  );
}
