import createError from 'http-errors';
import { getUsage, getSessions, kickSessions } from './radiusdeskIntegration';
import { UsageStats } from '../types';

type SessionsPayload = Awaited<ReturnType<typeof getSessions>>;

export async function fetchUsage(
  username: string,
  password: string,
  mac: string | undefined,
  limit = 10,
  withSessions = true
): Promise<UsageStats> {
  const normalizedUsername = username?.trim();
  const normalizedPassword = password?.trim();

  if (!normalizedUsername || !normalizedPassword) {
    throw createError(400, 'username and password are required');
  }

  const normalizedMac = mac?.trim() || undefined;

  if (normalizedMac) {
    const usagePromise = getUsage(normalizedUsername, {
      password: normalizedPassword,
      mac: normalizedMac,
    });
    const sessionsPromise = withSessions ? getSessions(normalizedUsername, limit) : Promise.resolve(undefined);
    const [usage, sessions] = await Promise.all([usagePromise, sessionsPromise]);
    return {
      username: normalizedUsername,
      mac: normalizedMac,
      dataUsed: usage?.data?.data_used ?? undefined,
      dataCap: usage?.data?.data_cap ?? null,
      timeUsed: usage?.data?.time_used ?? undefined,
      timeCap: usage?.data?.time_cap ?? null,
      depleted: Boolean(usage?.data?.depleted),
      sessions: withSessions ? sessions?.items ?? [] : [],
    };
  }

  const sessions = await getSessions(normalizedUsername, limit);
  const derivedMac = extractMacFromSessions(sessions);

  if (!derivedMac) {
    throw createError(404, 'Unable to determine MAC address for this user');
  }

  const usage = await getUsage(normalizedUsername, {
    password: normalizedPassword,
    mac: derivedMac,
  });

  return {
    username: normalizedUsername,
    mac: derivedMac,
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
