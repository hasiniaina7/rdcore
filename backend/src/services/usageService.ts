import createError from 'http-errors';
import { getUsage, getSessions, kickSessions } from './radiusdeskIntegration';
import { UsageStats } from '../types';

export async function fetchUsage(username: string, mac: string, limit = 10): Promise<UsageStats> {
  if (!username || !mac) {
    throw createError(400, 'username and mac are required');
  }
  const [usage, sessions] = await Promise.all([
    getUsage(username, mac),
    getSessions(username, limit),
  ]);

  return {
    username,
    mac,
    dataUsed: usage?.data?.data_used ?? undefined,
    dataCap: usage?.data?.data_cap ?? null,
    timeUsed: usage?.data?.time_used ?? undefined,
    timeCap: usage?.data?.time_cap ?? null,
    depleted: Boolean(usage?.data?.depleted),
    sessions: sessions?.items ?? [],
  };
}

export async function disconnectSessions(radacctIds: string[]) {
  if (!radacctIds.length) {
    throw createError(400, 'radacctIds required');
  }
  await kickSessions(radacctIds);
}
