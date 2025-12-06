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
          <span className="ic-helper">Simulation UI — intégrer POST /api/sessions/disconnect ensuite.</span>
        </div>
      )}
    </div>
  );
}
