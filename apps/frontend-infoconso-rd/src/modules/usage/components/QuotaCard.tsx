import React from "react";
import { CapValue } from "../types";
import { describeQuota, percentProgress } from "../utils";

type Props = {
  title: string;
  cap: CapValue;
  used: CapValue;
  remaining: CapValue;
  percent?: number | null;
  icon?: React.ReactNode;
};

export function QuotaCard({ title, cap, used, remaining, percent, icon }: Props) {
  const { capLabel, usedLabel, remainingLabel } = describeQuota(cap, used, remaining);
  const computedPercent = percentProgress(used.raw ?? null, cap.raw ?? null, percent ?? null);
  const unlimited = cap.raw == null;
  const showProgress = computedPercent != null;
  const badgeLabel = showProgress ? `${computedPercent}% utilisé` : unlimited ? "Illimité" : "N/A";

  return (
    <div className="ic-card">
      <div className="ic-card-header">
        <div className="ic-card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && <span aria-hidden>{icon}</span>}
          <span>{title}</span>
        </div>
        <span className="ic-badge">{badgeLabel}</span>
      </div>

      {showProgress && (
        <div className="ic-progress" aria-label={`${computedPercent}% du quota utilisé`} role="progressbar" aria-valuenow={computedPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="ic-progress-bar" style={{ width: `${computedPercent}%` }} />
        </div>
      )}

      <div className="ic-card-body">
        <div className="ic-stat-row">
          <span className="label">Quota</span>
          <span>{capLabel}</span>
        </div>
        <div className="ic-stat-row">
          <span className="label">Consommé</span>
          <span>{usedLabel}</span>
        </div>
        <div className="ic-stat-row">
          <span className="label">Restant</span>
          <span>{remainingLabel}</span>
        </div>
      </div>
    </div>
  );
}
