import React from "react";
import { formatDateTime } from "../utils";

type Props = {
  isExpired: boolean;
  daysRemaining: number | null;
  createdAt: string;
  updatedAt: string;
  status?: string | null;
};

export function StatusPeriodCard({ isExpired, daysRemaining, createdAt, updatedAt, status }: Props) {
  return (
    <div className="ic-card">
      <div className="ic-card-header">
        <div>
          <div className="ic-card-title">État & période</div>
          {status && <div className="ic-card-subtitle">Statut: {status}</div>}
        </div>
        <span className={`ic-badge ${isExpired ? "danger" : "success"}`}>
          {isExpired ? "Expiré" : "Actif"}
        </span>
      </div>

      <div className="ic-card-body">
        <div className="ic-stat-row">
          <span className="label">Jours restants</span>
          <span>{daysRemaining ?? "—"}</span>
        </div>
        <div className="ic-stat-row">
          <span className="label">Créé</span>
          <span>{formatDateTime(createdAt)}</span>
        </div>
        <div className="ic-stat-row">
          <span className="label">Mis à jour</span>
          <span>{formatDateTime(updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
