import createError from 'http-errors';
import { getUsage, getSessions, kickSessions } from './radiusdeskIntegration';
import { UsageStats } from '../types';

export async function fetchUsage(
  username: string,
  password: string,
  mac: string | undefined,
  limit = 10,
  withSessions = true
): Promise<UsageStats> {
  if (!username || !password) {
    throw createError(400, 'username and password are required');
  }

  const usagePromise = getUsage(username, { password, mac });
  const sessionsPromise = withSessions ? getSessions(username, limit) : Promise.resolve(undefined);

  const [usage, sessions] = await Promise.all([usagePromise, sessionsPromise]);

  return {
    username,
    mac,
    dataUsed: usage?.data?.data_used ?? undefined,
    dataCap: usage?.data?.data_cap ?? null,
    timeUsed: usage?.data?.time_used ?? undefined,
    timeCap: usage?.data?.time_cap ?? null,
    depleted: Boolean(usage?.data?.depleted),
    sessions: withSessions ? sessions?.items ?? [] : [],
  };
}

export async function disconnectSessions(radacctIds: string[]) {
  if (!radacctIds.length) {
    throw createError(400, 'radacctIds required');
  }
  await kickSessions(radacctIds);
}
