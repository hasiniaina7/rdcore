import type { AdminUserInsights, RouterUsageStat } from '../types';
import { fetchUsageByUsername } from './usageInsightsService';
import { listActiveSessions, listInactiveSessions } from './sessionService';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRouterLabel = (record: Record<string, unknown>) => {
  const candidate =
    record.nasidentifier ||
    record.nasipaddress ||
    record.calledstationid ||
    record.apName ||
    record.router ||
    record.site ||
    'Unknown router';
  return String(candidate);
};

const getSessionBytes = (record: Record<string, unknown>) => {
  const down = toNumber(record.acctinputoctets);
  const up = toNumber(record.acctoutputoctets);
  const fallback = toNumber(record.bytes);
  const total = down + up;
  return total > 0 ? total : fallback;
};

export async function fetchAdminUserInsights(username: string, historyLimit?: number): Promise<AdminUserInsights> {
  const [usageSummary, activeSessions, inactiveSessions] = await Promise.all([
    fetchUsageByUsername(username, historyLimit),
    listActiveSessions(username, 50),
    listInactiveSessions(username, 120),
  ]);

  const routerMap = new Map<string, RouterUsageStat>();
  const accumulate = (records: Array<Record<string, unknown>>) => {
    for (const entry of records) {
      const label = getRouterLabel(entry);
      const stat = routerMap.get(label) ?? { label, totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 };
      stat.totalBytes += getSessionBytes(entry);
      stat.totalTimeSeconds += toNumber(entry.acctsessiontime);
      stat.sessionCount += 1;
      routerMap.set(label, stat);
    }
  };

  accumulate(activeSessions.sessions);
  accumulate(inactiveSessions.sessions);

  const routerStats = Array.from(routerMap.values()).sort((a, b) => b.totalBytes - a.totalBytes).slice(0, 10);

  return {
    username: usageSummary.username,
    macs: usageSummary.macs,
    historyLimit: usageSummary.historyLimit,
    periods: usageSummary.periods,
    activeSessions: activeSessions.sessions,
    inactiveSessions: inactiveSessions.sessions,
    activeCount: activeSessions.totalCount,
    inactiveCount: inactiveSessions.totalCount,
    routerStats,
    lastUpdated: new Date().toISOString(),
  };
}
