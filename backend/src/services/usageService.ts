import createError from 'http-errors';
import { timingSafeEqual } from 'crypto';
import {
  getUsage,
  getSessions,
  kickSessions,
  findPermanentUser,
  findVoucher,
  getPermanentUserPassword,
} from './radiusdeskIntegration';
import { UsageStats } from '../types';

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

  await ensureValidCredentials(normalizedUsername, normalizedPassword);

  const normalizedMac = mac?.trim() ? mac.trim() : undefined;
  const { usage, resolvedMac, sessions } = await resolveUsageAndSessions(
    normalizedUsername,
    normalizedPassword,
    normalizedMac,
    limit,
    withSessions
  );

  return {
    username: normalizedUsername,
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

async function ensureValidCredentials(username: string, password: string) {
  const permanentPassword = await loadPermanentPassword(username);
  if (permanentPassword !== undefined) {
    if (passwordsMatch(permanentPassword, password)) {
      return;
    }
    throw createError(401, 'Invalid username or password');
  }

  const voucherPassword = await loadVoucherPassword(username);
  if (voucherPassword !== undefined) {
    if (passwordsMatch(voucherPassword, password)) {
      return;
    }
    throw createError(401, 'Invalid username or password');
  }

  throw createError(401, 'Invalid username or password');
}

async function loadPermanentPassword(username: string): Promise<string | undefined> {
  const result = await findPermanentUser(username);
  const record = extractMatchingRecord(result, username, 'username');
  if (!record) {
    return undefined;
  }
  const id = extractIdentifier(record);
  if (!id) {
    return undefined;
  }
  const payload = await getPermanentUserPassword(id);
  return extractPasswordFromPayload(payload);
}

async function loadVoucherPassword(username: string): Promise<string | undefined> {
  const result = await findVoucher(username);
  const record = extractMatchingRecord(result, username, 'name');
  if (!record) {
    return undefined;
  }
  return extractVoucherPassword(record);
}

function extractMatchingRecord(
  payload: unknown,
  needle: string,
  field: 'username' | 'name'
): Record<string, unknown> | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }
  const container = (payload as Record<string, unknown>).items;
  if (!Array.isArray(container) || !container.length) {
    return undefined;
  }
  const normalizedNeedle = needle.toLowerCase();
  for (const entry of container) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const value = record[field];
    if (typeof value === 'string' && value.toLowerCase() === normalizedNeedle) {
      return record;
    }
  }
  const first = container[0];
  return typeof first === 'object' && first ? (first as Record<string, unknown>) : undefined;
}

function extractIdentifier(record: Record<string, unknown>): string | undefined {
  const raw = record.id ?? record.user_id ?? record.uuid;
  if (typeof raw === 'string') {
    return raw;
  }
  if (typeof raw === 'number') {
    return String(raw);
  }
  return undefined;
}

function extractPasswordFromPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }
  const data = payload as Record<string, unknown>;
  const direct = data.value ?? data.password;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }
  const nested = data.data;
  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>;
    const nestedValue = nestedRecord.value ?? nestedRecord.password;
    if (typeof nestedValue === 'string' && nestedValue.trim()) {
      return nestedValue.trim();
    }
  }
  return undefined;
}

function extractVoucherPassword(record: Record<string, unknown>): string | undefined {
  if (typeof record.password === 'string' && record.password.trim()) {
    return record.password.trim();
  }
  if (record.single_field && typeof record.name === 'string' && record.name.trim()) {
    return record.name.trim();
  }
  return undefined;
}

function passwordsMatch(expected: string, provided: string) {
  if (expected.length !== provided.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}
