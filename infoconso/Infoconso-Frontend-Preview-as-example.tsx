import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CheckCircle2, Wifi, Clock, Database, LogOut } from "lucide-react";

/**
 * Frontend preview for Info Consommation.
 * - Static mock login flow (no API calls)
 * - Separate login UX for Permanent User vs Voucher
 *   - Voucher: username === password (single field)
 * - Displays consumption state using the provided JSON sample
 *
 * Intended for copying/adapting into existing frontend with same palettes.
 */

// -----------------------------
// Types
// -----------------------------

type Unit = "GB" | "MB" | "KB" | "bytes" | "seconds" | "minutes" | "hours" | "days" | null;

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
  radacctid: number;
  acctsessionid: string;
  username: string;
  nasidentifier?: string;
  framedipaddress?: string;
  callingstationid?: string;
  acctstarttime?: string;
  acctupdatetime?: string;
  acctstoptime?: string | number | null;
  acctsessiontime?: number;
  acctinputoctets?: number;
  acctoutputoctets?: number;
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
      username: "demo-voucher",
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
      username: "demo-voucher",
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
      username: "demo-voucher",
      totalCount: 2,
      radiusdeskTotal: 2,
      sessions: [
        {
          radacctid: 97853,
          acctsessionid: "8070001c",
          acctuniqueid: "e51b47b4cb5fcf839c7180c3c93c9403",
          username: "demo-voucher",
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
        } as any,
        {
          radacctid: 97789,
          acctsessionid: "80700014",
          acctuniqueid: "18ee359172977b0d6ffd3f249a5684b2",
          username: "demo-voucher",
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
        } as any,
      ],
    },
    inactiveSessions: {
      username: "demo-voucher",
      totalCount: 9,
      radiusdeskTotal: 9,
      sessions: [
        {
          radacctid: 94006,
          acctsessionid: "80600088",
          acctuniqueid: "f643affe213ff8389307bf2b18332440",
          username: "demo-voucher",
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
        } as any,
        {
          radacctid: 93968,
          acctsessionid: "80600087",
          acctuniqueid: "d71b0cf23f9f5e1a29ed92dba1a80cad",
          username: "demo-voucher",
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
        } as any,
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
  return `${v.toFixed(v < 10 && i > 0 ? 2 : 0)} ${units[i]}`;
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
  // Prefer formatted/unit when available
  const capText = cap.raw == null ? "Illimité" : `${cap.formatted ?? "—"} ${cap.unit ?? ""}`.trim();
  const usedText = used.raw == null ? "—" : `${used.formatted ?? "—"} ${used.unit ?? ""}`.trim();
  const remText = remaining.raw == null ? "—" : `${remaining.formatted ?? "—"} ${remaining.unit ?? ""}`.trim();
  return { capText, usedText, remText };
}

// -----------------------------
// UI Components
// -----------------------------

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-right">{value}</div>
    </div>
  );
}

function QuotaCard({
  title,
  icon,
  perc,
  cap,
  used,
  remaining,
  emptyLabel,
}: {
  title: string;
  icon: React.ReactNode;
  perc: number | null;
  cap: CapValue;
  used: CapValue;
  remaining: CapValue;
  emptyLabel: string;
}) {
  const { capText, usedText, remText } = quotaLabel(cap, used, remaining);
  const progressValue = perc == null ? 0 : Math.min(100, Math.max(0, perc));
  const isUnlimited = cap.raw == null;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="inline-flex">{icon}</span>
          <span>{title}</span>
          {isUnlimited && (
            <Badge variant="secondary" className="ml-auto">
              {emptyLabel}
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
            <Progress value={progressValue} />
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

function PeriodChips({ periods }: { periods: PeriodItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {periods.map((p) => (
        <Card key={p.period} className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm capitalize">{p.period}</CardTitle>
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
            <YAxis tickFormatter={(v) => humanBytes(Number(v)).replace(/\s.*/, "")} />
            <Tooltip
              formatter={(value: any, name) =>
                name === "bytes" ? [humanBytes(Number(value)), "Data"] : [value, "Sessions"]
              }
            />
            <Bar dataKey="bytes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SessionTable({
  title,
  list,
  canDisconnect,
  onDisconnect,
}: {
  title: string;
  list: SessionList;
  canDisconnect?: boolean;
  onDisconnect?: (ids: number[]) => void;
}) {
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
          <Wifi className="w-4 h-4" />
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
          <div className="border rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs bg-muted/50">
              {canDisconnect && <div className="col-span-1">Sel.</div>}
              <div className={canDisconnect ? "col-span-3" : "col-span-4"}>NAS</div>
              <div className="col-span-2">IP</div>
              <div className="col-span-2">Début</div>
              <div className="col-span-2">Durée</div>
              <div className="col-span-2">Data</div>
            </div>
            {list.sessions.map((s) => {
              const bytes = (s.acctinputoctets ?? 0) + (s.acctoutputoctets ?? 0);
              return (
                <div
                  key={s.radacctid}
                  className="grid grid-cols-12 gap-2 px-3 py-2 text-xs border-t"
                >
                  {canDisconnect && (
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={!!selected[s.radacctid]}
                        onChange={() => toggle(s.radacctid)}
                      />
                    </div>
                  )}
                  <div className={canDisconnect ? "col-span-3" : "col-span-4"}>
                    {s.nasidentifier ?? "—"}
                  </div>
                  <div className="col-span-2">{s.framedipaddress ?? "—"}</div>
                  <div className="col-span-2">{s.acctstarttime ?? "—"}</div>
                  <div className="col-span-2">
                    {s.acctsessiontime != null ? humanSeconds(s.acctsessiontime) : s.online_human ?? "—"}
                  </div>
                  <div className="col-span-2">{humanBytes(bytes)}</div>
                </div>
              );
            })}
          </div>
        )}

        {canDisconnect && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="destructive"
              disabled={selectedIds.length === 0}
              onClick={() => onDisconnect?.(selectedIds)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnecter {selectedIds.length || ""}
            </Button>
            <div className="text-xs text-muted-foreground">
              Simulation UI — brancher sur POST /api/sessions/disconnect.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// -----------------------------
// Main preview component
// -----------------------------

export default function InfoconsoFrontendPreview() {
  const [view, setView] = useState<"login" | "dashboard">("login");
  const [loginType, setLoginType] = useState<"voucher" | "user">("voucher");

  // Voucher login inputs (single field)
  const [voucherCode, setVoucherCode] = useState("demo-voucher");

  // Permanent user login inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Mock loaded data
  const [payload, setPayload] = useState<ConsumptionPayload | null>(null);

  const doLogin = () => {
    // Static simulation: always loads MOCK_RESPONSE.
    // In real integration:
    // - voucher: send { username: voucherCode, password: voucherCode }
    // - user: send { username, password }
    setPayload(MOCK_RESPONSE.data);
    setView("dashboard");
  };

  const logout = () => {
    setView("login");
    setPayload(null);
  };

  const onDisconnect = (ids: number[]) => {
    // Static simulation: filter out disconnected active sessions in UI only.
    if (!payload) return;
    const remaining = payload.activeSessions.sessions.filter(
      (s) => !ids.includes(s.radacctid)
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
  };

  if (view === "login") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-lg rounded-2xl">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <CardTitle className="text-xl">Info Consommation</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              Aperçu statique du flux de login + affichage conso.
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={loginType}
              onValueChange={(v) => setLoginType(v as any)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="voucher">Voucher</TabsTrigger>
                <TabsTrigger value="user">Utilisateur</TabsTrigger>
              </TabsList>

              <TabsContent value="voucher" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Code voucher</Label>
                    <Input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Entrez votre code"
                    />
                    <div className="text-xs text-muted-foreground">
                      Pour un voucher, le mot de passe est identique au username.
                    </div>
                  </div>

                  <Button className="w-full" onClick={doLogin}>
                    Consulter ma consommation
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="user" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nom d'utilisateur"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <Button className="w-full" onClick={doLogin}>
                    Se connecter
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payload) return null;

  const s = payload.summary;
  const periods = payload.insights.periods;

  return (
    <div className="min-h-screen w-full p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Compte</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-semibold">{s.username}</div>
              <Badge variant="outline" className="capitalize">
                {s.accountType}
              </Badge>
              {s.status && (
                <Badge variant="secondary" className="capitalize">
                  {s.status}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Profil: <span className="text-foreground">{s.profile ?? "—"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={logout}>
              Retour login
            </Button>
          </div>
        </div>

        {/* Summary grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuotaCard
            title="Quota Data"
            icon={<Database className="w-4 h-4" />}
            perc={s.percDataUsed}
            cap={s.dataCap}
            used={s.dataUsed}
            remaining={s.dataRemaining}
            emptyLabel="N/A"
          />

          <QuotaCard
            title="Quota Temps"
            icon={<Clock className="w-4 h-4" />}
            perc={s.percTimeUsed}
            cap={s.timeCap}
            used={s.timeUsed}
            remaining={s.timeRemaining}
            emptyLabel="Illimité"
          />

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">État & Période</CardTitle>
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

        {/* Recent activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activité récente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-xl border p-3">
                <StatRow label="Dernier succès" value={formatISO(payload.recentActivity.lastAcceptTime)} />
                <StatRow label="NAS" value={payload.recentActivity.lastAcceptNas ?? "—"} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Résumé des 30 derniers jours</CardTitle>
            </CardHeader>
            <CardContent>
              <PeriodChips periods={periods} />
            </CardContent>
          </Card>
        </div>

        {/* Series chart */}
        <SeriesChart buckets={payload.insights.series.buckets} />

        {/* Sessions */}
        <div className="grid grid-cols-1 gap-4">
          <SessionTable
            title="Sessions actives"
            list={payload.activeSessions}
            canDisconnect
            onDisconnect={onDisconnect}
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
