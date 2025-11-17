import createError from 'http-errors';
import { getSessions } from './radiusdeskIntegration';
import { SessionListResult } from '../types';

type SessionRecord = Record<string, unknown> & {
  acctstoptime?: string | null;
};

const clampLimit = (value: number | undefined, fallback: number) => {
  if (!Number.isFinite(value as number)) {
    return fallback;
  }
  return Math.min(200, Math.max(1, Number(value)));
};

const toArray = (items: unknown): SessionRecord[] =>
  Array.isArray(items) ? (items as SessionRecord[]).filter((item) => item && typeof item === 'object') : [];

export async function listActiveSessions(username: string, limit?: number): Promise<SessionListResult> {
  const normalizedLimit = clampLimit(limit, 20);
  if (!username?.trim()) {
    throw createError(400, 'username is required');
  }

  const response = await getSessions(username.trim(), normalizedLimit, { onlyConnected: true });
  const sessions = toArray(response?.items);
  return {
    username: username.trim(),
    totalCount: sessions.length,
    radiusdeskTotal: typeof response?.totalCount === 'number' ? response.totalCount : sessions.length,
    sessions,
  };
}

export async function listInactiveSessions(username: string, limit?: number): Promise<SessionListResult> {
  const normalizedLimit = clampLimit(limit, 50);
  if (!username?.trim()) {
    throw createError(400, 'username is required');
  }

  // Fetch a bit more than requested to account for filtering of active sessions.
  const fetchLimit = Math.min(200, normalizedLimit * 2);
  const response = await getSessions(username.trim(), fetchLimit, { onlyConnected: false });
  const filtered = toArray(response?.items).filter((item) => Boolean(item.acctstoptime));
  const sessions = filtered.slice(0, normalizedLimit);

  return {
    username: username.trim(),
    totalCount: sessions.length,
    radiusdeskTotal: typeof response?.totalCount === 'number' ? response.totalCount : filtered.length,
    sessions,
  };
}
