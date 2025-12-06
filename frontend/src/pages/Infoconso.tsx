import React, { useMemo, useState, type ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { disconnectConsumptionSessions } from "@/modules/usage/api";

/**
 * Info Consommation — UI preview
 *
 * Objectif:
 * - UI propre et moderne, facile à intégrer dans votre frontend existant
 * - Simulation statique (pas d'appel API)
 * - UX séparée Voucher vs Utilisateur
 *   - Voucher: username === password → un seul champ
 *
 * À brancher ensuite sur:
 * - POST /api/consumption/login
 * - POST /api/sessions/disconnect
 */

// -----------------------------
// Types
// -----------------------------

type Unit =
  | "GB"
  | "MB"
  | "KB"
  | "bytes"
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | null;

type CapValue = {
  raw: number | null;
  formatted: string | null;
  unit: Unit;
};

type Summary = {
  username: string;
  accountType: "voucher" | "permanent" | "unknown";
  profile: string | null;
  status: string | null;
  dataCap: CapValue;
  dataUsed: CapValue;
  dataRemaining: CapValue;
  percDataUsed: number | null;
  timeCap: CapValue;
  timeUsed: CapValue;
  timeRemaining: CapValue;
  percTimeUsed: number | null;
  isExpired: boolean;
  daysRemaining: number | null;
  metadata: { createdAt: string; updatedAt: string };
};

type RecentActivity = {
  lastAcceptTime?: string | null;
  lastAcceptNas?: string | null;
  lastRejectTime?: string | null;
  lastRejectNas?: string | null;
  lastRejectReasonSimple?: string | null;
};

type PeriodItem = {
  period: "hourly" | "daily" | "weekly" | "monthly";
  totalBytes: number;
  totalTimeSeconds: number;
  sessionCount: number;
};

type SeriesBucket = {
  index: number;
  label: string;
  start: string;
  end: string;
  totalBytes: number;
  totalTimeSeconds: number;
  sessionCount: number;
};

type Insights = {
  username: string;
  historyLimit: number;
  macs?: string[];
  periods: PeriodItem[];
  series: {
    startDate: string;
    endDate: string;
    granularity: "day" | "hour" | "week" | "month";
    buckets: SeriesBucket[];
  };
};

type Session = {
  id?: number;
  radacctid: number;
  acctsessionid?: string;
  acctuniqueid?: string;
  username: string;
  realm?: string;
  nasipaddress?: string;
  nasidentifier?: string;
  nasportid?: string;
  nasporttype?: string;
  acctstarttime?: string;
  acctupdatetime?: string;
  acctstoptime?: string | number | null;
  acctinterval?: number | null;
  acctsessiontime?: number | null;
  acctinputoctets?: number | null;
  acctoutputoctets?: number | null;
  framedipaddress?: string;
  callingstationid?: string;
  calledstationid?: string;
  acctterminatecause?: string;
  online_human?: string;
  active?: boolean;
};

type SessionList = {
  username: string;
  totalCount: number;
  radiusdeskTotal: number;
  sessions: Session[];
};

type ConsumptionPayload = {
  summary: Summary;
  recentActivity: RecentActivity;
  insights: Insights;
  activeSessions: SessionList;
  inactiveSessions: SessionList;
};

// -----------------------------
// Mock data (from user JSON)
// -----------------------------

const MOCK_RESPONSE: { success: boolean; data: ConsumptionPayload } = {
  success: true,
  data: {
    summary: {
      username: "ableexperience",
      accountType: "voucher",
      profile: "003-Classique-10Go-5000Ar",
      status: "used",
      dataCap: { raw: 10737418240, formatted: "10.00", unit: "GB" },
      dataUsed: { raw: 1678372315, formatted: "1.56", unit: "GB" },
      dataRemaining: { raw: 9059045925, formatted: "8.44", unit: "GB" },
      percDataUsed: 16,
      timeCap: { raw: null, formatted: null, unit: null },
      timeUsed: { raw: 0, formatted: "0", unit: "seconds" },
      timeRemaining: { raw: null, formatted: null, unit: null },
      percTimeUsed: null,
      isExpired: false,
      daysRemaining: null,
      metadata: {
        createdAt: "2025-11-07T08:12:22.000Z",
        updatedAt: "2025-11-08T15:56:04.000Z",
      },
    },
    recentActivity: {
      lastAcceptTime: "2025-11-08T15:53:38.000Z",
      lastAcceptNas: "Routeur_Antsorokavo",
    },
    insights: {
      username: "ableexperience",
      historyLimit: 200,
      macs: ["9A:E5:49:61:CB:4E", "9A-E5-49-61-CB-4E"],
      periods: [
        { period: "hourly", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
        { period: "daily", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
        { period: "weekly", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
        {
          period: "monthly",
          totalBytes: 3749118502,
          totalTimeSeconds: 128783,
          sessionCount: 9,
        },
      ],
      series: {
        startDate: "2025-11-04T21:00:00.000Z",
        endDate: "2025-12-05T20:59:59.999Z",
        granularity: "day",
        buckets: [
          { index: 0, label: "Wed", start: "2025-11-04T21:00:00.000Z", end: "2025-11-05T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 1, label: "Thu", start: "2025-11-05T21:00:00.000Z", end: "2025-11-06T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 2, label: "Fri", start: "2025-11-06T21:00:00.000Z", end: "2025-11-07T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 3, label: "Sat", start: "2025-11-07T21:00:00.000Z", end: "2025-11-08T20:59:59.999Z", totalBytes: 1678372315, totalTimeSeconds: 30926, sessionCount: 4 },
          { index: 4, label: "Sun", start: "2025-11-08T21:00:00.000Z", end: "2025-11-09T20:59:59.999Z", totalBytes: 1071641594, totalTimeSeconds: 13649, sessionCount: 1 },
          { index: 5, label: "Mon", start: "2025-11-09T21:00:00.000Z", end: "2025-11-10T20:59:59.999Z", totalBytes: 21725127, totalTimeSeconds: 9444, sessionCount: 1 },
          { index: 6, label: "Tue", start: "2025-11-10T21:00:00.000Z", end: "2025-11-11T20:59:59.999Z", totalBytes: 977379466, totalTimeSeconds: 74764, sessionCount: 3 },
          { index: 7, label: "Wed", start: "2025-11-11T21:00:00.000Z", end: "2025-11-12T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 8, label: "Thu", start: "2025-11-12T21:00:00.000Z", end: "2025-11-13T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 9, label: "Fri", start: "2025-11-13T21:00:00.000Z", end: "2025-11-14T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 10, label: "Sat", start: "2025-11-14T21:00:00.000Z", end: "2025-11-15T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 11, label: "Sun", start: "2025-11-15T21:00:00.000Z", end: "2025-11-16T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 12, label: "Mon", start: "2025-11-16T21:00:00.000Z", end: "2025-11-17T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 13, label: "Tue", start: "2025-11-17T21:00:00.000Z", end: "2025-11-18T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 14, label: "Wed", start: "2025-11-18T21:00:00.000Z", end: "2025-11-19T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 15, label: "Thu", start: "2025-11-19T21:00:00.000Z", end: "2025-11-20T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 16, label: "Fri", start: "2025-11-20T21:00:00.000Z", end: "2025-11-21T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 17, label: "Sat", start: "2025-11-21T21:00:00.000Z", end: "2025-11-22T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 18, label: "Sun", start: "2025-11-22T21:00:00.000Z", end: "2025-11-23T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 19, label: "Mon", start: "2025-11-23T21:00:00.000Z", end: "2025-11-24T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 20, label: "Tue", start: "2025-11-24T21:00:00.000Z", end: "2025-11-25T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 21, label: "Wed", start: "2025-11-25T21:00:00.000Z", end: "2025-11-26T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 22, label: "Thu", start: "2025-11-26T21:00:00.000Z", end: "2025-11-27T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 23, label: "Fri", start: "2025-11-27T21:00:00.000Z", end: "2025-11-28T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 24, label: "Sat", start: "2025-11-28T21:00:00.000Z", end: "2025-11-29T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 25, label: "Sun", start: "2025-11-29T21:00:00.000Z", end: "2025-11-30T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 26, label: "Mon", start: "2025-11-30T21:00:00.000Z", end: "2025-12-01T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 27, label: "Tue", start: "2025-12-01T21:00:00.000Z", end: "2025-12-02T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 28, label: "Wed", start: "2025-12-02T21:00:00.000Z", end: "2025-12-03T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 29, label: "Thu", start: "2025-12-03T21:00:00.000Z", end: "2025-12-04T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
          { index: 30, label: "Fri", start: "2025-12-04T21:00:00.000Z", end: "2025-12-05T20:59:59.999Z", totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
        ],
      },
    },
    activeSessions: {
      username: "ableexperience",
      totalCount: 2,
      radiusdeskTotal: 2,
      sessions: [
        {
          radacctid: 97853,
          acctsessionid: "8070001c",
          acctuniqueid: "e51b47b4cb5fcf839c7180c3c93c9403",
          username: "ableexperience",
          realm: "prod",
          nasipaddress: "10.5.0.7",
          nasidentifier: "Routeur_Antsorokavo",
          nasportid: "bridge",
          nasporttype: "Wireless-802.11",
          acctstarttime: "2025-11-17 05:11:25",
          acctupdatetime: "2025-11-17T05:55:22+00:00",
          acctstoptime: 1598950,
          acctinterval: 0,
          acctsessiontime: 2637,
          acctinputoctets: 2035068,
          acctoutputoctets: 13827841,
          calledstationid: "hotspot1",
          callingstationid: "9A:E5:49:61:CB:4E",
          framedipaddress: "192.168.120.7",
          online_human: "2 weeks",
          active: true,
          id: 97853,
        },
        {
          radacctid: 97789,
          acctsessionid: "80700014",
          acctuniqueid: "18ee359172977b0d6ffd3f249a5684b2",
          username: "ableexperience",
          realm: "prod",
          nasipaddress: "10.5.0.7",
          nasidentifier: "Routeur_Antsorokavo",
          nasportid: "bridge",
          nasporttype: "Wireless-802.11",
          acctstarttime: "2025-11-17 03:08:36",
          acctupdatetime: "2025-11-17T05:55:34+00:00",
          acctstoptime: 1606330,
          acctinterval: 60,
          acctsessiontime: 10018,
          acctinputoctets: 136,
          acctoutputoctets: 200,
          calledstationid: "hotspot1",
          callingstationid: "9A:E5:49:61:CB:4E",
          framedipaddress: "192.168.120.5",
          online_human: "2 weeks",
          active: true,
          id: 97789,
        },
      ],
    },
    inactiveSessions: {
      username: "ableexperience",
      totalCount: 9,
      radiusdeskTotal: 9,
      sessions: [
        {
          radacctid: 94006,
          acctsessionid: "80600088",
          acctuniqueid: "f643affe213ff8389307bf2b18332440",
          username: "ableexperience",
          realm: "prod",
          nasidentifier: "Routeur_Antsorokavo",
          acctstarttime: "2025-11-11 12:43:53",
          acctupdatetime: "2025-11-11T22:36:57+00:00",
          acctstoptime: "2025-11-11 22:37:39",
          acctsessiontime: 35325,
          acctinputoctets: 34355419,
          acctoutputoctets: 338029395,
          callingstationid: "9A:E5:49:61:CB:4E",
          framedipaddress: "192.168.120.17",
          active: false,
          id: 94006,
        },
        {
          radacctid: 93968,
          acctsessionid: "80600087",
          acctuniqueid: "d71b0cf23f9f5e1a29ed92dba1a80cad",
          username: "ableexperience",
          realm: "prod",
          nasidentifier: "Routeur_Antsorokavo",
          acctstarttime: "2025-11-11 11:37:09",
          acctupdatetime: "2025-11-11T16:19:10+00:00",
          acctstoptime: "2025-11-11 16:20:09",
          acctsessiontime: 16678,
          acctinputoctets: 16911048,
          acctoutputoctets: 588082672,
          callingstationid: "9A:E5:49:61:CB:4E",
          framedipaddress: "192.168.120.193",
          active: false,
          id: 93968,
        },
      ],
    },
  },
};

// -----------------------------
// Helpers
// -----------------------------

function formatISO(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  return d.toLocaleString();
}

function humanBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = v < 10 && i > 0 ? 2 : v < 100 && i > 0 ? 1 : 0;
  return `${v.toFixed(digits)} ${units[i]}`;
}

function humanSeconds(sec: number) {
  if (!Number.isFinite(sec)) return "0s";
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}j`;
}

function quotaLabel(cap: CapValue, used: CapValue, remaining: CapValue) {
  const capText =
    cap.raw == null ? "Illimité" : `${cap.formatted ?? "—"} ${cap.unit ?? ""}`.trim();
  const usedText =
    used.raw == null ? "—" : `${used.formatted ?? "—"} ${used.unit ?? ""}`.trim();
  const remText =
    remaining.raw == null
      ? "—"
      : `${remaining.formatted ?? "—"} ${remaining.unit ?? ""}`.trim();
  return { capText, usedText, remText };
}

function safePercent(v: number | null) {
  if (v == null || !Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

// -----------------------------
// UI parts
// -----------------------------

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="cp-stat-row flex items-center justify-between gap-4 py-1">
      <div className="cp-stat-row__label text-sm text-muted-foreground">{label}</div>
      <div className="cp-stat-row__value text-sm font-medium text-right">{value}</div>
    </div>
  );
}

function QuotaCard(props: {
  title: string;
  icon: React.ReactNode;
  perc: number | null;
  cap: CapValue;
  used: CapValue;
  remaining: CapValue;
  unlimitedBadge: string;
}) {
  const { title, icon, perc, cap, used, remaining, unlimitedBadge } = props;
  const { capText, usedText, remText } = quotaLabel(cap, used, remaining);
  const isUnlimited = cap.raw == null;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="inline-flex">{icon}</span>
          <span>{title}</span>
          {isUnlimited && (
            <Badge variant="secondary" className="ml-auto">
              {unlimitedBadge}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isUnlimited && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Utilisé</span>
              <span className="font-medium">{perc ?? 0}%</span>
            </div>
            <Progress value={safePercent(perc)} />
          </div>
        )}

        <div className="rounded-xl border p-3">
          <StatRow label="Quota" value={capText || "—"} />
          <StatRow label="Consommé" value={usedText || "—"} />
          <StatRow label="Restant" value={remText || "—"} />
        </div>
      </CardContent>
    </Card>
  );
}

function PeriodCards({ periods }: { periods: PeriodItem[] }) {
  const labelMap: Record<PeriodItem["period"], string> = {
    hourly: "Heure",
    daily: "Jour",
    weekly: "Semaine",
    monthly: "Mois",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {periods.map((p) => (
        <Card key={p.period} className="rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">{labelMap[p.period]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <StatRow label="Data" value={humanBytes(p.totalBytes)} />
            <StatRow label="Temps" value={humanSeconds(p.totalTimeSeconds)} />
            <StatRow label="Sessions" value={p.sessionCount} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SeriesChart({ buckets }: { buckets: SeriesBucket[] }) {
  const data = useMemo(
    () =>
      buckets.map((b) => ({
        label: b.label,
        bytes: b.totalBytes,
        sessions: b.sessionCount,
      })),
    [buckets]
  );

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Consommation par jour</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis
              tickFormatter={(v) => {
                const n = Number(v);
                if (!Number.isFinite(n) || n <= 0) return "0";
                // show compact units for ticks
                if (n >= 1024 ** 3) return `${Math.round(n / 1024 ** 3)}G`;
                if (n >= 1024 ** 2) return `${Math.round(n / 1024 ** 2)}M`;
                if (n >= 1024) return `${Math.round(n / 1024)}K`;
                return String(Math.round(n));
              }}
            />
            <Tooltip
              formatter={(value: any, name) =>
                name === "bytes"
                  ? [humanBytes(Number(value)), "Data"]
                  : [Number(value), "Sessions"]
              }
              labelFormatter={(l) => `Jour: ${l}`}
            />
            <Bar dataKey="bytes" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SessionTable(props: {
  title: string;
  list: SessionList;
  canDisconnect?: boolean;
  onDisconnect?: (ids: number[]) => void;
  disconnecting?: boolean;
  disconnectStatus?: { state: "idle" | "loading" | "success" | "error"; message?: string };
}) {
  const {
    title,
    list,
    canDisconnect,
    onDisconnect,
    disconnecting = false,
    disconnectStatus,
  } = props;
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const toggle = (id: number) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const selectedIds = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => Number(k));

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{title}</span>
          <Badge variant="secondary" className="ml-auto">
            {list.totalCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.sessions.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucune session.</div>
        ) : (
          <div className="cp-table-wrapper">
            <table>
              <thead>
                <tr>
                  {canDisconnect && <th style={{ width: '4rem' }}>Sel.</th>}
                  <th>NAS</th>
                  <th>IP</th>
                  <th>Début</th>
                  <th>Durée</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {list.sessions.map((s) => {
                  const bytes = (s.acctinputoctets ?? 0) + (s.acctoutputoctets ?? 0);
                  const duration =
                    s.acctsessiontime != null
                      ? humanSeconds(s.acctsessiontime)
                      : s.online_human ?? '—';

                  return (
                    <tr key={s.radacctid}>
                      {canDisconnect && (
                        <td>
                          <input
                            type="checkbox"
                            checked={!!selected[s.radacctid]}
                            onChange={() => toggle(s.radacctid)}
                          />
                        </td>
                      )}
                      <td>{s.nasidentifier ?? '—'}</td>
                      <td>{s.framedipaddress ?? '—'}</td>
                      <td>{s.acctstarttime ?? '—'}</td>
                      <td>{duration}</td>
                      <td>{humanBytes(bytes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {canDisconnect && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 text-xs text-amber-600">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
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
              <div>
                La déconnexion d’une session en cours peut interrompre la connexion et nécessiter une reconnexion.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={selectedIds.length === 0 || disconnecting}
                onClick={() => onDisconnect?.(selectedIds)}
              >
                {disconnecting ? "Déconnexion..." : "Déconnecter"}{" "}
                {selectedIds.length ? `(${selectedIds.length})` : ""}
              </Button>
            </div>
            {disconnectStatus?.state === "success" && (
              <div className="text-xs text-green-600">{disconnectStatus.message}</div>
            )}
            {disconnectStatus?.state === "error" && (
              <div className="text-xs text-red-600">{disconnectStatus.message}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// -----------------------------
// Main component
// -----------------------------

export default function InfoconsoFrontendPreview() {
  const [view, setView] = useState<"login" | "dashboard">("login");
  const [loginType, setLoginType] = useState<"voucher" | "user">("voucher");

  // Voucher login (single field)
  const [voucherCode, setVoucherCode] = useState("");

  // User login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Mock data
  const [payload, setPayload] = useState<ConsumptionPayload | null>(null);
  const [authCredentials, setAuthCredentials] = useState<{ username: string; password: string } | null>(null);
  const [disconnectStatus, setDisconnectStatus] = useState<{
    state: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ state: "idle" });
  const disconnecting = disconnectStatus.state === "loading";

  const doLogin = () => {
    const credUsername = loginType === "voucher" ? voucherCode.trim() : username.trim();
    const credPassword = loginType === "voucher" ? voucherCode.trim() : password.trim();
    setAuthCredentials(credUsername ? { username: credUsername, password: credPassword } : null);
    setPayload(MOCK_RESPONSE.data);
    setView("dashboard");
    setDisconnectStatus({ state: "idle" });
  };

  const logout = () => {
    setPayload(null);
    setView("login");
  };

  const onDisconnect = async (ids: number[]) => {
    if (!payload || ids.length === 0) return;
    if (!authCredentials?.username || !authCredentials?.password) {
      setDisconnectStatus({ state: "error", message: "Reconnectez-vous pour déconnecter une session." });
      return;
    }
    try {
      setDisconnectStatus({ state: "loading" });
      await disconnectConsumptionSessions({
        username: authCredentials.username,
        password: authCredentials.password,
        radacctIds: ids.map(String),
      });
      const remaining = payload.activeSessions.sessions.filter(
        (s) => !ids.includes(s.radacctid),
      );
      setPayload({
        ...payload,
        activeSessions: {
          ...payload.activeSessions,
          sessions: remaining,
          totalCount: remaining.length,
          radiusdeskTotal: remaining.length,
        },
      });
      setDisconnectStatus({ state: "success", message: "Session(s) déconnectée(s)." });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Impossible de déconnecter la session.";
      setDisconnectStatus({ state: "error", message });
    }
  };

  if (view === "login") {
    return (
      <div className="cp-infoconso-login-root">
        <section className="cp-infoconso-login-card">
          <header className="cp-infoconso-login-header">
            <p className="cp-eyebrow">Info consommation</p>
            <h1 className="cp-title">Consulter votre consommation</h1>
            <p className="cp-card__meta">
              Saisissez vos identifiants ou votre code voucher pour afficher le détail de
              votre connexion.
            </p>
          </header>

          <div className="cp-infoconso-login-body">
            <Tabs
              value={loginType}
              onValueChange={(v) => setLoginType(v as 'voucher' | 'user')}
              className="cp-infoconso-tabs"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="voucher">Voucher</TabsTrigger>
                <TabsTrigger value="user">Utilisateur</TabsTrigger>
              </TabsList>

              <TabsContent value="voucher">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Code voucher</Label>
                    <Input
                      value={voucherCode}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setVoucherCode(e.target.value)
                      }
                      placeholder="Ex. fatherlymarble"
                    />
                    <div className="cp-infoconso-help">
                      Pour un voucher, le mot de passe est identique au username.
                    </div>
                  </div>
                  <Button className="cp-infoconso-primary-btn" onClick={doLogin}>
                    Consulter ma consommation
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="user">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={username}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setUsername(e.target.value)
                        }
                        placeholder="Ex. utilisateur123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setPassword(e.target.value)
                        }
                        placeholder="Doit commencer par le nom d’utilisateur"
                      />
                    </div>
                  </div>
                  <Button className="cp-infoconso-primary-btn" onClick={doLogin}>
                    Se connecter
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    );
  }

  if (!payload) return null;

  const s = payload.summary;
  const periods = payload.insights.periods;

  return (
    <div className="cp-infoconso-root">
      <div className="cp-infoconso-container">
        {/* Header */}
        <header className="cp-infoconso-header">
          <div className="cp-infoconso-header-main">
            <p className="cp-eyebrow">Info consommation</p>
            <h1 className="cp-title">Vue d’ensemble de votre connexion</h1>
            <p className="cp-card__meta">
              Compte <strong>{s.username}</strong>
              {s.profile ? ` · ${s.profile}` : ''}
            </p>
          </div>
          <div className="cp-infoconso-header-meta">
            <div className="cp-infoconso-badges">
              <span className="cp-badge cp-badge--info cp-infoconso-badge">
                {s.accountType}
              </span>
              {s.status && (
                <span className="cp-badge cp-infoconso-badge">
                  {s.status}
                </span>
              )}
            </div>
            <button
              type="button"
              className="cp-link-button cp-infoconso-link"
              onClick={logout}
            >
              Changer de compte
            </button>
          </div>
        </header>

        {/* Summary cards */}
        <div className="cp-grid cp-grid--3 cp-infoconso-summary">
          <QuotaCard
            title="Quota Data"
            icon={null}
            perc={s.percDataUsed}
            cap={s.dataCap}
            used={s.dataUsed}
            remaining={s.dataRemaining}
            unlimitedBadge="N/A"
          />

          <QuotaCard
            title="Quota Temps"
            icon={null}
            perc={s.percTimeUsed}
            cap={s.timeCap}
            used={s.timeUsed}
            remaining={s.timeRemaining}
            unlimitedBadge="Illimité"
          />

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">État &amp; Période</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-xl border p-3">
                <StatRow
                  label="Expiré"
                  value={
                    s.isExpired ? (
                      <Badge variant="destructive">Oui</Badge>
                    ) : (
                      <Badge variant="secondary">Non</Badge>
                    )
                  }
                />
                <StatRow label="Jours restants" value={s.daysRemaining ?? "—"} />
                <StatRow label="Créé" value={formatISO(s.metadata.createdAt)} />
                <StatRow label="Mis à jour" value={formatISO(s.metadata.updatedAt)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity + periods */}
        <div className="cp-grid cp-grid--2 cp-infoconso-activity">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activité récente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-xl border p-3">
                <StatRow
                  label="Dernier succès"
                  value={formatISO(payload.recentActivity.lastAcceptTime)}
                />
                <StatRow label="NAS" value={payload.recentActivity.lastAcceptNas ?? "—"} />
                {payload.recentActivity.lastRejectTime && (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <StatRow
                      label="Dernier refus"
                      value={formatISO(payload.recentActivity.lastRejectTime)}
                    />
                    <StatRow
                      label="Raison"
                      value={payload.recentActivity.lastRejectReasonSimple ?? "—"}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Résumé 30 jours</CardTitle>
            </CardHeader>
            <CardContent>
              <PeriodCards periods={periods} />
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <SeriesChart buckets={payload.insights.series.buckets} />

        {/* Sessions */}
        <div className="cp-grid cp-infoconso-sessions">
          <SessionTable
            title="Sessions actives"
            list={payload.activeSessions}
            canDisconnect
            onDisconnect={onDisconnect}
            disconnecting={disconnecting}
            disconnectStatus={disconnectStatus}
          />
          <SessionTable
            title="Historique (sessions fermées)"
            list={payload.inactiveSessions}
          />
        </div>
      </div>
    </div>
  );
}
