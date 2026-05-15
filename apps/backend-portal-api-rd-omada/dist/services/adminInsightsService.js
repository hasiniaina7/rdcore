"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdminUserInsights = fetchAdminUserInsights;
const usageInsightsService_1 = require("./usageInsightsService");
const sessionService_1 = require("./sessionService");
const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};
const getRouterLabel = (record) => {
    const candidate = record.nasidentifier ||
        record.nasipaddress ||
        record.calledstationid ||
        record.apName ||
        record.router ||
        record.site ||
        'Unknown router';
    return String(candidate);
};
const getSessionBytes = (record) => {
    const down = toNumber(record.acctinputoctets);
    const up = toNumber(record.acctoutputoctets);
    const fallback = toNumber(record.bytes);
    const total = down + up;
    return total > 0 ? total : fallback;
};
async function fetchAdminUserInsights(username, historyLimit) {
    const [usageSummary, activeSessions, inactiveSessions] = await Promise.all([
        (0, usageInsightsService_1.fetchUsageByUsername)(username, historyLimit),
        (0, sessionService_1.listActiveSessions)(username, { limit: 50 }),
        (0, sessionService_1.listInactiveSessions)(username, { limit: 120 }),
    ]);
    const routerMap = new Map();
    const accumulate = (records) => {
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
        series: usageSummary.series,
        activeSessions: activeSessions.sessions,
        inactiveSessions: inactiveSessions.sessions,
        activeCount: activeSessions.totalCount,
        inactiveCount: inactiveSessions.totalCount,
        routerStats,
        lastUpdated: new Date().toISOString(),
    };
}
//# sourceMappingURL=adminInsightsService.js.map