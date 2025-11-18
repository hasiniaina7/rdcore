export type UsagePeriodKey = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface UsageCredentials {
  username: string;
  password: string;
  mac?: string;
}

export interface UsageSessionsOptions {
  limit?: number;
}

export interface UsageStats {
  username: string;
  mac?: string;
  dataUsed?: number;
  dataCap?: number | null;
  timeUsed?: number;
  timeCap?: number | null;
  depleted: boolean;
  sessions: SessionRecord[];
}

export interface UsagePeriodSummary {
  period: UsagePeriodKey;
  totalBytes: number;
  totalTimeSeconds: number;
  sessionCount: number;
}

export interface UsageByUsernameSummary {
  username: string;
  historyLimit: number;
  macs: string[];
  periods: UsagePeriodSummary[];
}

export interface SessionListResult {
  username: string;
  totalCount: number;
  radiusdeskTotal?: number;
  sessions: SessionRecord[];
}

export type SessionRecord = Record<string, unknown> & {
  radacctid?: string | number;
  id?: string | number;
  acctstarttime?: string;
  acctstoptime?: string | null;
  acctsessiontime?: number | string;
  nasidentifier?: string;
  nasipaddress?: string;
  calledstationid?: string;
  callingstationid?: string;
  callingstationmac?: string;
  framedipaddress?: string;
};

export type DashboardSession = SessionRecord & {
  status: 'active' | 'inactive';
};

export interface UsageFilters {
  startDate?: string;
  endDate?: string;
  router?: string;
  deviceMac?: string;
  minMegabytes?: number;
  status?: 'all' | 'active' | 'inactive';
}

export interface AggregatedUsagePoint {
  label: string;
  totalBytes: number;
  totalTimeSeconds: number;
  sessionCount: number;
}

export interface DailyUsagePoint {
  date: string;
  totalBytes: number;
  totalTimeSeconds: number;
  sessionCount: number;
}
