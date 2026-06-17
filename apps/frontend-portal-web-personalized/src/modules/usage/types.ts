export type UsagePeriodKey = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface UsageSessionsOptions {
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface UsageStats {
  username: string;
  accountType: 'permanent' | 'voucher' | 'unknown';
  mac?: string;
  dataUsed?: number;
  dataCap?: number | null;
  timeUsed?: number;
  timeCap?: number | null;
  expiresAt?: string;
  timeRemainingSeconds?: number;
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
  series: UsageTimeseries;
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

export type UsageTimeseriesGranularity = 'hour' | 'day' | 'month';

export interface UsageTimeseriesBucket {
  index: number;
  label: string;
  start: string;
  end: string;
  totalBytes: number;
  totalTimeSeconds: number;
  sessionCount: number;
}

export interface UsageTimeseries {
  startDate: string;
  endDate: string;
  granularity: UsageTimeseriesGranularity;
  buckets: UsageTimeseriesBucket[];
}
