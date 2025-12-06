export type Unit = "GB" | "MB" | "KB" | "bytes" | "seconds" | "minutes" | "hours" | "days" | null;

export type CapValue = {
  raw: number | null;
  formatted: string | null;
  unit: Unit;
};

export type Summary = {
  username: string;
  accountType: "voucher" | "user" | "permanent" | "unknown";
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

export type RecentActivity = {
  lastAcceptTime?: string | null;
  lastAcceptNas?: string | null;
  lastRejectTime?: string | null;
  lastRejectNas?: string | null;
  lastRejectReasonSimple?: string | null;
};

export type PeriodItem = {
  period: "hourly" | "daily" | "weekly" | "monthly" | string;
  totalBytes: number;
  totalTimeSeconds: number;
  sessionCount: number;
};

export type SeriesBucket = {
  index: number;
  label: string;
  start: string;
  end: string;
  totalBytes: number;
  totalTimeSeconds: number;
  sessionCount: number;
};

export type Insights = {
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

export type Session = {
  radacctid: number;
  acctsessionid: string;
  acctuniqueid?: string;
  username: string;
  groupname?: string;
  realm?: string;
  nasipaddress?: string;
  nasidentifier?: string;
  nasportid?: string;
  nasporttype?: string;
  acctstarttime?: string;
  acctupdatetime?: string;
  acctstoptime?: string | number | null;
  acctinterval?: number;
  acctsessiontime?: number;
  acctinputoctets?: number;
  acctoutputoctets?: number;
  acctauthentic?: string;
  calledstationid?: string;
  callingstationid?: string;
  acctterminatecause?: string;
  servicetype?: string;
  framedprotocol?: string;
  framedipaddress?: string;
  connectinfo_start?: string;
  connectinfo_stop?: string;
  acctstartdelay?: number | null;
  acctstopdelay?: number | null;
  xascendsessionsvrkey?: string | null;
  operator_name?: string;
  framedipv6address?: string;
  framedipv6prefix?: string;
  framedinterfaceid?: string;
  delegatedipv6prefix?: string;
  user_type?: string;
  online_human?: string;
  active?: boolean;
  id?: number;
};

export type SessionList = {
  username: string;
  totalCount: number;
  radiusdeskTotal: number;
  sessions: Session[];
};

export type ConsumptionData = {
  summary: Summary;
  recentActivity: RecentActivity;
  insights: Insights;
  activeSessions: SessionList;
  inactiveSessions: SessionList;
};

export type ConsumptionResponse = {
  success: boolean;
  data: ConsumptionData;
};

export type LoginType = "voucher" | "user";

export type LoginPayload =
  | { type: "voucher"; code: string }
  | { type: "user"; username: string; password: string };
