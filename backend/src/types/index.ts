export type DynamicLanguage = {
  id: string;
  value: string;
};

export interface DynamicSettings {
  show_logo?: boolean;
  show_name?: boolean;
  name_colour?: string;
  show_screen_delay?: number;
  available_languages?: DynamicLanguage[];
  social_login?: {
    active: boolean;
    temp_username?: string;
    temp_password?: string;
    items?: { name: string }[];
  };
  click_to_connect?: Record<string, unknown>;
}

export interface DynamicDetailData {
  detail?: Record<string, unknown>;
  settings?: DynamicSettings;
  photos?: Array<Record<string, unknown>>;
  pages?: Array<Record<string, unknown>>;
  client_info?: Record<string, unknown>;
}

export interface DynamicDetailResponse {
  success?: boolean;
  data?: DynamicDetailData | Record<string, unknown> | null;
  message?: string;
}

export interface OmadaPortalPayload {
  clientMac: string;
  site?: string;
  radioId: number;
  time: number;
  authType: number;
  redirectUrl?: string;
  apMac?: string;
  gatewayMac?: string;
  ssidName?: string;
  vid?: number;
  accessToken: string;
}

export type ConnectMode = 'permanent' | 'voucher' | 'click' | 'social';

export interface ConnectRequestContext {
  mode: ConnectMode;
  username?: string;
  password?: string;
  voucherCode?: string;
  mac?: string;
  dynamicKey?: string;
  omada: OmadaPortalPayload;
}

export interface ConnectResult {
  status: 'accepted' | 'pending' | 'rejected';
  message: string;
  nextRedirect?: string;
  omadaSite?: string;
  username?: string;
  mac?: string;
  requestId: string;
}

export interface UsageStats {
  username: string;
  mac?: string;
  dataUsed?: number;
  dataCap?: number | null;
  timeUsed?: number;
  timeCap?: number | null;
  expiresAt?: string;
  timeRemainingSeconds?: number;
  depleted: boolean;
  sessions: Array<Record<string, unknown>>;
}

export type UsagePeriodKey = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface UsagePeriodSummary {
  period: UsagePeriodKey;
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
  sessions: Array<Record<string, unknown>>;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  details?: Record<string, unknown>;
}

export type AdminAuthMode = 'static' | 'radiusmysql';

export interface AdminSession {
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
  periods: UsagePeriodSummary[];
  series: UsageTimeseries;
  activeSessions: Array<Record<string, unknown>>;
  inactiveSessions: Array<Record<string, unknown>>;
  activeCount: number;
  inactiveCount: number;
  routerStats: RouterUsageStat[];
  lastUpdated: string;
}
