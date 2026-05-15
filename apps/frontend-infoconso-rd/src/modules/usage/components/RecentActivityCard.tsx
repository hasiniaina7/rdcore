import React from "react";
import { RecentActivity } from "../types";
import { formatDateTime } from "../utils";

type Props = {
  activity: RecentActivity;
};

export function RecentActivityCard({ activity }: Props) {
  const hasData =
    activity.lastAcceptTime || activity.lastRejectTime || activity.lastAcceptNas || activity.lastRejectNas;

  return (
    <div className="ic-card">
      <div className="ic-card-header">
        <div className="ic-card-title">Activité récente</div>
        {!hasData && <span className="ic-badge muted">Aucune donnée</span>}
      </div>

      {hasData ? (
        <div className="ic-card-body">
          <div className="ic-stat-row">
            <span className="label">Dernier succès</span>
            <span>{formatDateTime(activity.lastAcceptTime)}</span>
          </div>
          <div className="ic-stat-row">
            <span className="label">NAS</span>
            <span>{activity.lastAcceptNas ?? "—"}</span>
          </div>
          {activity.lastRejectTime && (
            <div className="ic-stat-row">
              <span className="label">Dernier rejet</span>
              <span>{formatDateTime(activity.lastRejectTime)}</span>
            </div>
          )}
          {activity.lastRejectReasonSimple && (
            <div className="ic-stat-row">
              <span className="label">Motif</span>
              <span>{activity.lastRejectReasonSimple}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="ic-empty">Aucune activité récente.</div>
      )}
    </div>
  );
}
