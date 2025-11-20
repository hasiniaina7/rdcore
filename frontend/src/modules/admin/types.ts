import type { UsageTimeseries } from '../usage/types';

export type AdminAuthMode = 'static' | 'radiusmysql';

export interface AdminAuthModes {
  availableModes: AdminAuthMode[];
  defaultMode: AdminAuthMode | null;
}

export interface AdminLoginPayload {
  username: string;
  password: string;
  mode?: AdminAuthMode;
}

export interface AdminLoginResult {
  token: string;
  expiresAt: number;
  mode: AdminAuthMode;
}

export interface AdminSessionInfo {
  username: string;
  mode: AdminAuthMode;
}

export interface RouterUsageStat {
  label: string;
  totalBytes: number;
  totalTimeSeconds: number;
  sessionCount: number;
}

export interface AdminUserInsights {
  username: string;
  macs: string[];
  historyLimit: number;
  periods: Array<{
    period: string;
    totalBytes: number;
    totalTimeSeconds: number;
    sessionCount: number;
  }>;
  series: UsageTimeseries;
  activeSessions: Array<Record<string, unknown>>;
  inactiveSessions: Array<Record<string, unknown>>;
  activeCount: number;
  inactiveCount: number;
  routerStats: RouterUsageStat[];
  lastUpdated: string;
}
