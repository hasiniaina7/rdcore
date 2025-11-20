import createError from 'http-errors';
import { getSessions } from './radiusdeskIntegration';
import { SessionListResult } from '../types';

type SessionRecord = Record<string, unknown> & {
  acctstoptime?: string | null;
  acctstarttime?: string | null;
  start_time?: string | null;
};

type SessionFilters = {
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  status?: 'all' | 'active' | 'inactive';
};

const clampLimit = (value: number | undefined, fallback: number) => {
  if (!Number.isFinite(value as number)) {
    return fallback;
  }
  return Math.min(200, Math.max(1, Number(value)));
};

const toArray = (items: unknown): SessionRecord[] =>
  Array.isArray(items) ? (items as SessionRecord[]).filter((item) => item && typeof item === 'object') : [];

const toTimestamp = (date: Date | undefined, inclusiveEnd = false): number | undefined => {
  if (!date) {
    return undefined;
  }
  const clone = new Date(date);
  if (inclusiveEnd) {
    clone.setMilliseconds(clone.getMilliseconds() + 999);
  }
  const value = clone.getTime();
  return Number.isNaN(value) ? undefined : value;
};

const parseRecordStart = (record: SessionRecord): number | undefined => {
  const raw = record.acctstarttime ?? record.start_time;
  if (!raw) {
    return undefined;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const isActiveRecord = (record: SessionRecord) => !record.acctstoptime;

const applyFilters = (records: SessionRecord[], filters: SessionFilters, defaultStatus: 'active' | 'inactive') => {
  const status = filters.status ?? defaultStatus;
  const start = toTimestamp(filters.startDate);
  const end = toTimestamp(filters.endDate, true);

  return records.filter((record) => {
    if (status === 'active' && !isActiveRecord(record)) {
      return false;
    }
    if (status === 'inactive' && isActiveRecord(record)) {
      return false;
    }
    const startTime = parseRecordStart(record);
    if (start && typeof startTime === 'number' && startTime < start) {
      return false;
    }
    if (end && typeof startTime === 'number' && startTime > end) {
      return false;
    }
    return true;
  });
};

export async function listActiveSessions(username: string, filters?: SessionFilters): Promise<SessionListResult> {
  if (!username?.trim()) {
    throw createError(400, 'username is required');
  }
  const normalizedLimit = clampLimit(filters?.limit, 20);
  const response = await getSessions(username.trim(), normalizedLimit, { onlyConnected: true });
  const filtered = applyFilters(toArray(response?.items), filters ?? {}, 'active');
  const sessions = filtered.slice(0, normalizedLimit);
  return {
    username: username.trim(),
    totalCount: sessions.length,
    radiusdeskTotal: typeof response?.totalCount === 'number' ? response.totalCount : filtered.length,
    sessions,
  };
}

export async function listInactiveSessions(username: string, filters?: SessionFilters): Promise<SessionListResult> {
  if (!username?.trim()) {
    throw createError(400, 'username is required');
  }
  const normalizedLimit = clampLimit(filters?.limit, 50);
  const fetchLimit = Math.min(200, normalizedLimit * 2);
  const response = await getSessions(username.trim(), fetchLimit, { onlyConnected: false });
  const filtered = applyFilters(
    toArray(response?.items).filter((item) => Boolean(item.acctstoptime)),
    filters ?? {},
    'inactive'
  );
  const sessions = filtered.slice(0, normalizedLimit);

  return {
    username: username.trim(),
    totalCount: sessions.length,
    radiusdeskTotal: typeof response?.totalCount === 'number' ? response.totalCount : filtered.length,
    sessions,
  };
}
