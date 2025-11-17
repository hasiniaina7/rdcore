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
  sessions: Array<Record<string, unknown>>;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  details?: Record<string, unknown>;
}
