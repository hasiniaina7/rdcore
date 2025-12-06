import React from "react";
import { PeriodItem } from "../types";
import { formatBytes, formatDuration } from "../utils";

type Props = {
  periods: PeriodItem[];
};

export function PeriodsCard({ periods }: Props) {
  return (
    <div className="ic-card">
      <div className="ic-card-header">
        <div>
          <div className="ic-card-title">Résumé 30 jours</div>
          <div className="ic-card-subtitle">Heure / jour / semaine / mois</div>
        </div>
      </div>

      {periods.length === 0 ? (
        <div className="ic-empty">Aucune donnée de période.</div>
      ) : (
        <div className="ic-grid-2">
          {periods.map((item) => (
            <div key={item.period} className="ic-card" style={{ boxShadow: "none", borderColor: "#eef2f7" }}>
              <div className="ic-card-header">
                <div className="ic-card-title" style={{ textTransform: "capitalize" }}>
                  {item.period === "monthly" ? "Mensuel" : item.period === "weekly" ? "Hebdo" : item.period === "daily" ? "Quotidien" : item.period === "hourly" ? "Horaire" : item.period}
                </div>
                <span className="ic-badge muted">{item.sessionCount} session(s)</span>
              </div>
              <div className="ic-card-body">
                <div className="ic-stat-row">
                  <span className="label">Données</span>
                  <span>{formatBytes(item.totalBytes)}</span>
                </div>
                <div className="ic-stat-row">
                  <span className="label">Temps</span>
                  <span>{formatDuration(item.totalTimeSeconds)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
