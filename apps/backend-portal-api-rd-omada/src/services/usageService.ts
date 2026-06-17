import createError from 'http-errors';
import { getUsage, getSessions, kickSessions, findPermanentUser, findVoucher } from './radiusdeskIntegration';
import { UsageStats } from '../types';
import config from '../config';

type SessionsPayload = Awaited<ReturnType<typeof getSessions>>;
type RadiusdeskCollection = {
  items?: Array<Record<string, unknown>>;
};

type AccountType = 'permanent' | 'voucher' | 'unknown';

type QuotaMetadata = {
  accountType: AccountType;
  expiresAt?: string;
  timeCapSeconds?: number | null;
  timeUsedSeconds?: number;
  dataUsedBytes?: number;
  dataCapBytes?: number | null;
};

const toNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toIsoDate = (value: unknown): string | undefined => {
  if (value == null) {
    return undefined;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return new Date(value).toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    const ts = Date.parse(value);
    if (Number.isNaN(ts)) {
      return undefined;
    }
    return new Date(ts).toISOString();
  }
  return undefined;
};

const computeRemainingSeconds = (timeCapSeconds?: number | null, timeUsedSeconds?: number, expiresAt?: string) => {
  if (typeof timeCapSeconds === 'number' && typeof timeUsedSeconds === 'number') {
    return Math.max(0, Math.floor(timeCapSeconds - timeUsedSeconds));
  }
  if (typeof timeCapSeconds === 'number') {
    return Math.max(0, Math.floor(timeCapSeconds));
  }
  if (expiresAt) {
    const expires = Date.parse(expiresAt);
    if (!Number.isNaN(expires)) {
      return Math.max(0, Math.floor((expires - Date.now()) / 1000));
    }
  }
  return undefined;
};

const extractFirstRecord = (payload: RadiusdeskCollection | undefined): Record<string, unknown> | undefined => {
  if (!payload?.items || !Array.isArray(payload.items)) {
    return undefined;
  }
  return payload.items[0];
};

const hasQuotaMetadata = (quota: QuotaMetadata) =>
  Boolean(
    quota.expiresAt ||
      typeof quota.timeCapSeconds === 'number' ||
      typeof quota.timeUsedSeconds === 'number' ||
      typeof quota.dataUsedBytes === 'number' ||
      typeof quota.dataCapBytes === 'number'
  );

const buildUsageFromQuota = (
  username: string,
  quota: QuotaMetadata,
  withSessions: boolean,
  mac?: string
): UsageStats => {
  const timeRemainingSeconds = computeRemainingSeconds(quota.timeCapSeconds, quota.timeUsedSeconds, quota.expiresAt);
  return {
    username,
    accountType: quota.accountType,
    mac,
    dataUsed: quota.dataUsedBytes ?? undefined,
    dataCap: quota.dataCapBytes ?? null,
    timeUsed: quota.timeUsedSeconds ?? undefined,
    timeCap: quota.timeCapSeconds ?? null,
    expiresAt: quota.expiresAt,
    timeRemainingSeconds,
    depleted: false,
    sessions: withSessions ? [] : [],
  };
};

async function fetchQuotaMetadata(username: string | undefined): Promise<QuotaMetadata> {
  const normalized = username?.trim();
  if (!normalized) {
    return { accountType: 'unknown' };
  }
  try {
    const response = await findPermanentUser(normalized);
    const record = extractFirstRecord(response);
    if (record) {
      const expiresAt = toIsoDate(record.to_date ?? record.expire ?? record.toDate);
      const timeCapSeconds = toNumber(record.time_cap ?? record.timeCap);
      const timeUsedSeconds = toNumber(record.time_used ?? record.timeUsed);
      const dataUsedBytes = toNumber(record.data_used ?? record.dataUsed);
      const dataCapBytes = toNumber(record.data_cap ?? record.dataCap) ?? null;
      return {
        accountType: 'permanent',
        expiresAt,
        timeCapSeconds: timeCapSeconds ?? null,
        timeUsedSeconds: timeUsedSeconds ?? undefined,
        dataUsedBytes,
        dataCapBytes,
      };
    }
  } catch {
    // Ignore lookup issues and fall back to vouchers.
  }
  try {
    const response = await findVoucher(normalized);
    const record = extractFirstRecord(response);
    if (record) {
      const expiresAt = toIsoDate(record.expire ?? record.to_date);
      const timeCapSeconds = toNumber(record.time_cap ?? record.timeCap);
      const timeUsedSeconds = toNumber(record.time_used ?? record.timeUsed);
      const dataUsedBytes = toNumber(record.data_used ?? record.dataUsed);
      const dataCapBytes = toNumber(record.data_cap ?? record.dataCap) ?? null;
      return {
        accountType: 'voucher',
        expiresAt,
        timeCapSeconds: timeCapSeconds ?? null,
        timeUsedSeconds: timeUsedSeconds ?? undefined,
        dataUsedBytes,
        dataCapBytes,
      };
    }
  } catch {
    // Ignore voucher lookup failures.
  }
  return { accountType: 'unknown' };
}

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
  const quotaPromise = fetchQuotaMetadata(normalizedUsername);

  if (normalizedMac) {
    const usagePromise = getUsage(normalizedUsername, {
      password: normalizedPassword,
      mac: normalizedMac,
    });
    const sessionsPromise = withSessions ? getSessions(normalizedUsername, limit) : Promise.resolve(undefined);
    const [usage, sessions, quota] = await Promise.all([usagePromise, sessionsPromise, quotaPromise]);
    const timeUsedSeconds = usage?.data?.time_used ?? quota.timeUsedSeconds;
    const timeCapSeconds = usage?.data?.time_cap ?? quota.timeCapSeconds ?? null;
    const timeRemainingSeconds = computeRemainingSeconds(timeCapSeconds, timeUsedSeconds, quota.expiresAt);
    const dataUsedBytes = quota.dataUsedBytes ?? usage?.data?.data_used ?? undefined;
    const dataCapBytes = quota.dataCapBytes ?? usage?.data?.data_cap ?? null;
    return {
      username: normalizedUsername,
      accountType: quota.accountType,
      mac: normalizedMac,
      dataUsed: dataUsedBytes,
      dataCap: dataCapBytes,
      timeUsed: timeUsedSeconds,
      timeCap: timeCapSeconds,
      expiresAt: quota.expiresAt,
      timeRemainingSeconds,
      depleted: Boolean(usage?.data?.depleted),
      sessions: withSessions ? sessions?.items ?? [] : [],
    };
  }

  const sessions = await getSessions(normalizedUsername, limit);
  const derivedMac = extractMacFromSessions(sessions);

  if (!derivedMac) {
    const quota = await quotaPromise;
    if (hasQuotaMetadata(quota)) {
      return buildUsageFromQuota(normalizedUsername, quota, withSessions);
    }
    if (config.ALLOW_USAGE_WITHOUT_MAC) {
      try {
        const usage = await getUsage(normalizedUsername, {
          password: normalizedPassword,
        });
        const timeUsedSeconds = usage?.data?.time_used ?? quota.timeUsedSeconds;
        const timeCapSeconds = usage?.data?.time_cap ?? quota.timeCapSeconds ?? null;
        const timeRemainingSeconds = computeRemainingSeconds(timeCapSeconds, timeUsedSeconds, quota.expiresAt);
        const dataUsedBytes = quota.dataUsedBytes ?? usage?.data?.data_used ?? undefined;
        const dataCapBytes = quota.dataCapBytes ?? usage?.data?.data_cap ?? null;
        return {
          username: normalizedUsername,
          accountType: quota.accountType,
          dataUsed: dataUsedBytes,
          dataCap: dataCapBytes,
          timeUsed: timeUsedSeconds,
          timeCap: timeCapSeconds,
          expiresAt: quota.expiresAt,
          timeRemainingSeconds,
          depleted: Boolean(usage?.data?.depleted),
          sessions: withSessions ? sessions?.items ?? [] : [],
        };
      } catch {
        // As a last resort, return a minimal payload when allowed (prevents 404 on missing MAC)
        return buildUsageFromQuota(normalizedUsername, quota, withSessions);
      }
    }
    throw createError(404, 'Unable to determine MAC address for this user');
  }

  const [usage, quota] = await Promise.all([
    getUsage(normalizedUsername, {
      password: normalizedPassword,
      mac: derivedMac,
    }),
    quotaPromise,
  ]);

  const timeUsedSeconds = usage?.data?.time_used ?? quota.timeUsedSeconds;
  const timeCapSeconds = usage?.data?.time_cap ?? quota.timeCapSeconds ?? null;
  const timeRemainingSeconds = computeRemainingSeconds(timeCapSeconds, timeUsedSeconds, quota.expiresAt);

  const dataUsedBytes = quota.dataUsedBytes ?? usage?.data?.data_used ?? undefined;
  const dataCapBytes = quota.dataCapBytes ?? usage?.data?.data_cap ?? null;

  return {
    username: normalizedUsername,
    accountType: quota.accountType,
    mac: derivedMac,
    dataUsed: dataUsedBytes,
    dataCap: dataCapBytes,
    timeUsed: timeUsedSeconds,
    timeCap: timeCapSeconds,
    expiresAt: quota.expiresAt,
    timeRemainingSeconds,
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
