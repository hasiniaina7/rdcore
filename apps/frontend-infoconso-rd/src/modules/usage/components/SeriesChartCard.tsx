/**
 * SeriesChartCard.tsx
 *
 * Objectif:
 * - Corriger le chevauchement des labels X et de la légende
 * - Afficher Jour + Date lisibles en bas
 * - Garder Y/X/legend visibles et propres sur 30 jours
 * - Rester responsive et compatible Recharts 3.5.x
 *
 * À coller à la place de votre composant actuel.
 */

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SeriesBucket } from "../types";
import { formatBytes } from "../utils";

// ---- Local helpers ----
const dayMap: Record<string, string> = {
  Mon: "Lun",
  Tue: "Mar",
  Wed: "Mer",
  Thu: "Jeu",
  Fri: "Ven",
  Sat: "Sam",
  Sun: "Dim",
};

function safeFormatBytes(bytes: number) {
  try {
    return formatBytes(bytes);
  } catch {
    if (!Number.isFinite(bytes)) return "—";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  }
}

function parseDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatBucketLabels(bucket: SeriesBucket) {
  const d = parseDate(bucket.start);
  if (!d) {
    const fallback = bucket.label ?? "—";
    return { dayLabel: fallback, dateLabel: "—", fullLabel: fallback };
  }

  // Manual shift +3h to guarantee UTC+3 display
  const offsetMs = 3 * 3600 * 1000;
  // Use a new Date object shifted by offset
  const shifted = new Date(d.getTime() + offsetMs);

  // Use 'UTC' timezone on the shifted date so it prints the shifted time as-is
  const en = shifted.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const frDay = dayMap[en] ?? en;

  const dayNum = shifted.toLocaleDateString("fr-FR", { day: "2-digit", timeZone: "UTC" });
  const month = shifted.toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" }).replace(/\./g, "");

  const dateLabel = `${dayNum} ${month}`;
  const fullLabel = `${frDay} ${dateLabel}`;

  return { dayLabel: frDay, dateLabel, fullLabel };
}

function calcTotalBytes(buckets: SeriesBucket[]) {
  return buckets.reduce((acc, b) => acc + (Number(b.totalBytes) || 0), 0);
}

function calcTotalSessions(buckets: SeriesBucket[]) {
  return buckets.reduce((acc, b) => acc + (Number(b.sessionCount) || 0), 0);
}

// Tick X sur 2 lignes pour éviter l'empilement horizontal.
function XTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  if (x == null || y == null || !payload) return null;
  const value = String(payload.value ?? "");
  const parts = value.split(" ");
  const line1 = parts[0] ?? value; // Jour court
  const line2 = parts.slice(1).join(" "); // Date courte

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" dominantBaseline="hanging" style={{ fontSize: 11 }}>
        <tspan x="0" dy="0">{line1}</tspan>
        {line2 ? <tspan x="0" dy="14">{line2}</tspan> : null}
      </text>
    </g>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: any; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload ?? {};
  const bytes = Number(p.value ?? payload[0]?.value ?? 0);
  const sessions = Number(p.sessionCount ?? 0);
  const label = String(p.fullLabel ?? "—");

  return (
    <div className="ic-chart-tooltip">
      <div className="ic-chart-tooltip__title">{label}</div>
      <div className="ic-chart-tooltip__row">
        <span>Data</span>
        <strong>{safeFormatBytes(bytes)}</strong>
      </div>
      <div className="ic-chart-tooltip__row">
        <span>Sessions</span>
        <strong>{sessions}</strong>
      </div>
    </div>
  );
}

type Props = {
  buckets: SeriesBucket[];
  title?: string;
  hintLeft?: string;
};

export function SeriesChartCard({
  buckets,
  title = "Consommation par jour",
  hintLeft = "Astuce : survolez une barre",
}: Props) {
  const chartData = useMemo(() => {
    return (buckets ?? []).map((bucket) => {
      const value = Number.isFinite(Number(bucket.totalBytes))
        ? Math.max(0, Number(bucket.totalBytes))
        : 0;
      const { dayLabel, dateLabel, fullLabel } = formatBucketLabels(bucket);

      return {
        ...bucket,
        value,
        dayLabel,
        dateLabel,
        fullLabel,
      };
    });
  }, [buckets]);

  const total = useMemo(() => calcTotalBytes(buckets ?? []), [buckets]);
  const totalSessions = useMemo(() => calcTotalSessions(buckets ?? []), [buckets]);

  // Densité des ticks: moins de labels quand la série est longue.
  const tickInterval = useMemo(() => {
    const n = buckets?.length ?? 0;
    if (n <= 10) return 0;
    if (n <= 20) return 1;
    if (n <= 31) return 2;
    return 3;
  }, [buckets]);

  return (
    <section className="cp-card ic-chart-card">
      <header className="cp-card__header ic-chart-card__header">
        <div>
          <h3 className="cp-card__title">{title}</h3>
          <p className="cp-text-muted cp-text-muted--small">
            Total: {safeFormatBytes(total)}
          </p>
        </div>
        <span className="cp-badge cp-badge--soft">Session(s): {totalSessions}</span>
      </header>

      <div className="cp-card__body">
        <div className="ic-chart-wrapper">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 8, bottom: 48 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="fullLabel"
                interval={tickInterval}
                height={48}
                tick={<XTick />}
                tickMargin={8}
                minTickGap={8}
              />
              <YAxis
                width={60}
                tickMargin={8}
                domain={[0, "dataMax"]}
                tickFormatter={(v) => safeFormatBytes(Number(v))}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Légende en dehors du chart pour éviter tout chevauchement */}
        <div className="ic-chart-legend ic-chart-legend--below">
          <span>{hintLeft}</span>
          <span>
            {buckets?.length ?? 0} jour(s) • {safeFormatBytes(total)}
          </span>
        </div>
      </div>
    </section>
  );
}

export default SeriesChartCard;

/*
  CSS suggéré (à ajouter/adapter dans infoconso.css)

  .ic-chart-card__header { align-items: flex-start; }
  .ic-chart-wrapper { width: 100%; }

  .ic-chart-legend--below {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 0.85rem;
  }

  .ic-chart-tooltip {
    background: var(--cp-surface, #fff);
    border: 1px solid var(--cp-border, rgba(0,0,0,.08));
    border-radius: 12px;
    padding: 10px 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,.08);
    min-width: 160px;
  }
  .ic-chart-tooltip__title { font-weight: 600; margin-bottom: 6px; }
  .ic-chart-tooltip__row { display: flex; justify-content: space-between; gap: 12px; }
*/
