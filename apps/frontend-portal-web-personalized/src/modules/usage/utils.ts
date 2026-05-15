import type {
  AggregatedUsagePoint,
  DashboardSession,
  DailyUsagePoint,
  SessionRecord,
  UsageFilters,
  UsagePeriodSummary,
} from './types';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDate = (value: unknown): Date | null => {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Date(value) : null;
  }
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : new Date(timestamp);
  }
  return null;
};

export const bytesToHuman = (bytes?: number | null, precision = 1): string => {
  if (bytes == null) {
    return '—';
  }
  let value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) {
    return '—';
  }
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : precision)} ${BYTE_UNITS[unit]}`;
};

export const secondsToDuration = (seconds?: number | null): string => {
  if (seconds == null) {
    return '—';
  }
  const totalSeconds = Math.max(0, Math.floor(Number(seconds)));
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return `${hours} h ${mins} min`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days} d ${remHours} h`;
};

export const getSessionBytes = (session: SessionRecord): number => {
  const down = toNumber(session.acctinputoctets);
  const up = toNumber(session.acctoutputoctets);
  const fallback = toNumber(session.bytes);
  const total = down + up;
  return total > 0 ? total : fallback;
};

export const getSessionDurationSeconds = (session: SessionRecord): number => {
  const duration = toNumber(session.acctsessiontime);
  if (duration > 0) {
    return duration;
  }
  const start = toDate(session.acctstarttime);
  const stop = toDate(session.acctstoptime ?? undefined);
  if (start && stop) {
    return Math.max(0, Math.floor((stop.getTime() - start.getTime()) / 1000));
  }
  if (start && !stop) {
    return Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
  }
  return 0;
};

export const getRouterLabel = (session: SessionRecord): string => {
  const candidate =
    session.nasidentifier ||
    session.nasipaddress ||
    session.calledstationid ||
    session.apName ||
    session.router ||
    session.site ||
    'Unknown router';
  return String(candidate);
};

export const getMacAddress = (session: SessionRecord): string | undefined => {
  const raw =
    session.callingstationid ||
    session.callingstationmac ||
    session.mac ||
    session.clientMac ||
    session.device_mac ||
    session.client_mac;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return undefined;
};

export const clampDateToDay = (value: Date): string => value.toISOString().slice(0, 10);

export const aggregateByDay = (sessions: SessionRecord[]): DailyUsagePoint[] => {
  const map = new Map<string, DailyUsagePoint>();
  for (const session of sessions) {
    const start = toDate(session.acctstarttime);
    if (!start) {
      continue;
    }
    const key = clampDateToDay(start);
    const entry = map.get(key) ?? { date: key, totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 };
    entry.totalBytes += getSessionBytes(session);
    entry.totalTimeSeconds += getSessionDurationSeconds(session);
    entry.sessionCount += 1;
    map.set(key, entry);
  }
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
};

export const aggregateByRouter = (sessions: SessionRecord[]): AggregatedUsagePoint[] => {
  const map = new Map<string, AggregatedUsagePoint>();
  for (const session of sessions) {
    const router = getRouterLabel(session);
    const entry = map.get(router) ?? { label: router, totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 };
    entry.totalBytes += getSessionBytes(session);
    entry.totalTimeSeconds += getSessionDurationSeconds(session);
    entry.sessionCount += 1;
    map.set(router, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.totalBytes - a.totalBytes);
};

const isWithinRange = (target: Date | null, start?: Date | null, end?: Date | null) => {
  if (!target) {
    return true;
  }
  if (start && target < start) {
    return false;
  }
  if (end && target > end) {
    return false;
  }
  return true;
};

export const filterSessions = (sessions: DashboardSession[], filters: UsageFilters): DashboardSession[] => {
  if (!filters || Object.values(filters).every((value) => value == null || value === '' || value === 'all')) {
    return sessions;
  }
  const startDateRaw = filters.startDate ? new Date(filters.startDate) : null;
  const startDate = startDateRaw && !Number.isNaN(startDateRaw.getTime()) ? startDateRaw : null;
  const endDateRaw = filters.endDate ? new Date(filters.endDate) : null;
  const endDate = endDateRaw && !Number.isNaN(endDateRaw.getTime()) ? endDateRaw : null;
  const minBytes = filters.minMegabytes ? filters.minMegabytes * 1024 * 1024 : 0;
  const routerFilter = filters.router?.toLowerCase();
  const macFilter = filters.deviceMac?.toLowerCase();
  const statusFilter = filters.status && filters.status !== 'all' ? filters.status : undefined;

  return sessions.filter((session) => {
    if (statusFilter && session.status !== statusFilter) {
      return false;
    }
    const start = toDate(session.acctstarttime);
    if (!isWithinRange(start, startDate, endDate ? new Date(endDate.getTime() + MS_PER_DAY - 1) : null)) {
      return false;
    }
    if (routerFilter) {
      const router = getRouterLabel(session).toLowerCase();
      if (!router.includes(routerFilter)) {
        return false;
      }
    }
    if (macFilter) {
      const mac = getMacAddress(session)?.toLowerCase();
      if (!mac || !mac.includes(macFilter)) {
        return false;
      }
    }
    if (minBytes && getSessionBytes(session) < minBytes) {
      return false;
    }
    return true;
  });
};

export const combineSessions = (
  active: SessionRecord[] | undefined,
  inactive: SessionRecord[] | undefined
): DashboardSession[] => {
  const decorate = (items: SessionRecord[] | undefined, status: DashboardSession['status']) =>
    (items ?? []).map((item) => ({ ...item, status } as DashboardSession));
  return [...decorate(active, 'active'), ...decorate(inactive, 'inactive')];
};

export const summarizePeriod = (
  periods: UsagePeriodSummary[] | undefined,
  period: UsagePeriodSummary['period']
): AggregatedUsagePoint => {
  const match = periods?.find((entry) => entry.period === period);
  if (!match) {
    return { label: period, totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 };
  }
  return {
    label: period,
    totalBytes: match.totalBytes,
    totalTimeSeconds: match.totalTimeSeconds,
    sessionCount: match.sessionCount,
  };
};

export const calculateProgress = (used?: number, cap?: number | null): number | null => {
  if (!cap || cap <= 0 || used == null) {
    return null;
  }
  return Math.min(100, Math.round((used / cap) * 100));
};

export const getRouterOptions = (sessions: SessionRecord[]): string[] => {
  const set = new Set<string>();
  for (const session of sessions) {
    set.add(getRouterLabel(session));
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

export const getMacOptions = (sessions: SessionRecord[]): string[] => {
  const set = new Set<string>();
  for (const session of sessions) {
    const mac = getMacAddress(session);
    if (mac) {
      set.add(mac);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};
