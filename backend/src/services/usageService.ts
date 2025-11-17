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

  const normalizedMac = mac?.trim() ? mac.trim() : undefined;
  const { usage, resolvedMac, sessions } = await resolveUsageAndSessions(
    username,
    password,
    normalizedMac,
    limit,
    withSessions
  );

  return {
    username,
    mac: resolvedMac,
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

type UsagePayload = Awaited<ReturnType<typeof getUsage>>;
type SessionsPayload = Awaited<ReturnType<typeof getSessions>>;

function extractMacFromSessions(sessions: SessionsPayload | undefined): string | undefined {
  const items = sessions?.items;
  if (!Array.isArray(items)) {
    return undefined;
  }
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    const candidate =
      typeof record.callingstationid === 'string'
        ? record.callingstationid
        : typeof record.callingstationmac === 'string'
          ? record.callingstationmac
          : typeof record.mac === 'string'
            ? record.mac
            : undefined;
    if (candidate?.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
}

async function resolveUsageAndSessions(
  username: string,
  password: string,
  mac: string | undefined,
  limit: number,
  withSessions: boolean
): Promise<{ usage: UsagePayload | undefined; sessions: SessionsPayload | undefined; resolvedMac?: string }> {
  if (mac) {
    const usagePromise = getUsage(username, { password, mac });
    const sessionsPromise = withSessions ? getSessions(username, limit) : Promise.resolve(undefined);
    const [usage, sessions] = await Promise.all([usagePromise, sessionsPromise]);
    return { usage, sessions, resolvedMac: mac };
  }

  const sessions = await getSessions(username, limit);
  const derivedMac = extractMacFromSessions(sessions);
  const usage = derivedMac ? await getUsage(username, { password, mac: derivedMac }) : undefined;
  return { usage, sessions, resolvedMac: derivedMac };
}
