import { CapValue, SessionList } from "../types";

export function formatBytes(bytes?: number | null, fractionDigits = 1): string {
  if (bytes == null || Number.isNaN(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  const precision = value < 10 && unitIndex > 0 ? Math.max(1, fractionDigits) : 0;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null || Number.isNaN(seconds)) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  let date = new Date(value);
  // Treat SQL strings "YYYY-MM-DD HH:MM:SS" as UTC by appending "Z"
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    date = new Date(value.replace(" ", "T") + "Z");
  }
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", { timeZone: "Africa/Nairobi" });

}

export function percentProgress(used?: number | null, cap?: number | null, fallback?: number | null): number | null {
  if (cap == null || cap === 0) return fallback ?? null;
  if (used == null) return fallback ?? null;
  return Math.min(100, Math.max(0, Math.round((used / cap) * 100)));
}

export function describeQuota(cap: CapValue, used: CapValue, remaining: CapValue) {
  const capLabel = cap.raw == null ? "Illimité" : `${cap.formatted ?? "—"} ${cap.unit ?? ""}`.trim();
  const usedLabel = used.raw == null ? "—" : `${used.formatted ?? "—"} ${used.unit ?? ""}`.trim();
  const remainingLabel = remaining.raw == null ? "—" : `${remaining.formatted ?? "—"} ${remaining.unit ?? ""}`.trim();
  return { capLabel, usedLabel, remainingLabel };
}

export type SessionRow = {
  id: number;
  nas: string;
  ip: string;
  start: string;
  duration: string;
  data: string;
  active: boolean;
};

export function combineSessions(list: SessionList): SessionRow[] {
  return list.sessions.map((s) => {
    const totalBytes = (s.acctinputoctets ?? 0) + (s.acctoutputoctets ?? 0);
    return {
      id: s.radacctid,
      nas: s.nasidentifier ?? "—",
      ip: s.framedipaddress ?? "—",
      start: formatDateTime(s.acctstarttime),
      duration: s.acctsessiontime != null ? formatDuration(s.acctsessiontime) : s.online_human ?? "—",
      data: formatBytes(totalBytes),
      active: !!s.active,
    };
  });
}
