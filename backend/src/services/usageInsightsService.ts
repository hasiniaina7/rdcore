import createError from 'http-errors';
import { getSessions } from './radiusdeskIntegration';
import { UsageByUsernameSummary, UsagePeriodSummary, UsagePeriodKey } from '../types';

const PERIODS: Array<{ period: UsagePeriodKey; windowMs: number }> = [
  { period: 'hourly', windowMs: 60 * 60 * 1000 },
  { period: 'daily', windowMs: 24 * 60 * 60 * 1000 },
  { period: 'weekly', windowMs: 7 * 24 * 60 * 60 * 1000 },
  { period: 'monthly', windowMs: 30 * 24 * 60 * 60 * 1000 },
];

const clampHistoryLimit = (value: number | undefined) => {
  if (!Number.isFinite(value as number)) {
    return 200;
  }
  return Math.min(500, Math.max(50, Number(value)));
};

const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const pickMac = (record: Record<string, unknown>): string | undefined => {
  const raw =
    record.callingstationid ??
    record.callingstationmac ??
    record.mac ??
    record.device_mac ??
    record.clientMac ??
    record.client_mac;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return undefined;
};

const parseDate = (value: unknown): number | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
};

export async function fetchUsageByUsername(username: string, historyLimit?: number): Promise<UsageByUsernameSummary> {
  if (!username?.trim()) {
    throw createError(400, 'username is required');
  }
  const normalizedLimit = clampHistoryLimit(historyLimit);
  const sessionsResponse = await getSessions(username.trim(), normalizedLimit, { onlyConnected: false });
  const items = Array.isArray(sessionsResponse?.items)
    ? (sessionsResponse.items as Record<string, unknown>[])
    : [];
  const macs = new Set<string>();
  const now = Date.now();
  const periodStates = PERIODS.map((period) => ({
    period: period.period,
    since: now - period.windowMs,
    totalBytes: 0,
    totalTimeSeconds: 0,
    sessionCount: 0,
  }));

  for (const entry of items) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const start = parseDate(entry.acctstarttime ?? entry.start_time);
    if (!start) {
      continue;
    }
    const bytes = toNumber(entry.acctinputoctets) + toNumber(entry.acctoutputoctets);
    const duration = toNumber(entry.acctsessiontime);
    const mac = pickMac(entry);
    if (mac) {
      macs.add(mac);
    }

    for (const state of periodStates) {
      if (start >= state.since) {
        state.totalBytes += bytes;
        state.totalTimeSeconds += duration;
        state.sessionCount += 1;
      }
    }
  }

  const periods: UsagePeriodSummary[] = periodStates.map((state) => ({
    period: state.period,
    totalBytes: state.totalBytes,
    totalTimeSeconds: state.totalTimeSeconds,
    sessionCount: state.sessionCount,
  }));

  return {
    username: username.trim(),
    historyLimit: normalizedLimit,
    macs: Array.from(macs),
    periods,
  };
}
