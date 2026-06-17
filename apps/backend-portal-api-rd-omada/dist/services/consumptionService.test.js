"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const consumptionService_1 = require("./consumptionService");
const usageService_1 = require("./usageService");
const usageInsightsService_1 = require("./usageInsightsService");
const sessionService_1 = require("./sessionService");
const radiusdeskIntegration_1 = require("./radiusdeskIntegration");
vitest_1.vi.mock('./usageService', () => ({
    fetchUsage: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('./usageInsightsService', () => ({
    fetchUsageByUsername: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('./sessionService', () => ({
    listActiveSessions: vitest_1.vi.fn(),
    listInactiveSessions: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('./radiusdeskIntegration', () => ({
    fetchUsage: vitest_1.vi.fn(),
    fetchUsageByUsername: vitest_1.vi.fn(),
    listActiveSessions: vitest_1.vi.fn(),
    listInactiveSessions: vitest_1.vi.fn(),
    findPermanentUser: vitest_1.vi.fn(),
    findVoucher: vitest_1.vi.fn(),
    getPermanentUserPassword: vitest_1.vi.fn(),
}));
const mockedFetchUsage = vitest_1.vi.mocked(usageService_1.fetchUsage);
const mockedFetchUsageByUsername = vitest_1.vi.mocked(usageInsightsService_1.fetchUsageByUsername);
const mockedListActiveSessions = vitest_1.vi.mocked(sessionService_1.listActiveSessions);
const mockedListInactiveSessions = vitest_1.vi.mocked(sessionService_1.listInactiveSessions);
const mockedFindPermanentUser = vitest_1.vi.mocked(radiusdeskIntegration_1.findPermanentUser);
const mockedFindVoucher = vitest_1.vi.mocked(radiusdeskIntegration_1.findVoucher);
const mockedGetPermanentUserPassword = vitest_1.vi.mocked(radiusdeskIntegration_1.getPermanentUserPassword);
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    mockedFetchUsage.mockResolvedValue({
        username: 'tsou',
        accountType: 'permanent',
        dataUsed: 123,
        dataCap: 800 * 1024 * 1024 * 1024,
        timeUsed: 0,
        timeCap: null,
        depleted: false,
        sessions: [],
    });
    mockedFetchUsageByUsername.mockResolvedValue({
        username: 'tsou',
        historyLimit: 200,
        macs: ['AA:BB:CC:DD:EE:FF'],
        periods: [
            { period: 'hourly', totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
            { period: 'daily', totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
            { period: 'weekly', totalBytes: 0, totalTimeSeconds: 0, sessionCount: 0 },
            { period: 'monthly', totalBytes: Math.round(421.6 * 1024 * 1024 * 1024), totalTimeSeconds: 0, sessionCount: 9 },
        ],
        series: { startDate: '', endDate: '', granularity: 'day', buckets: [] },
    });
    mockedListActiveSessions.mockResolvedValue({ username: 'tsou', totalCount: 0, sessions: [] });
    mockedListInactiveSessions.mockResolvedValue({ username: 'tsou', totalCount: 0, sessions: [] });
    mockedFindPermanentUser.mockResolvedValue({
        items: [
            {
                id: '42',
                username: 'tsou',
                profile: 'premium',
                status: 'active',
                active: 1,
            },
        ],
    });
    mockedFindVoucher.mockResolvedValue({ items: [] });
    mockedGetPermanentUserPassword.mockResolvedValue({ value: 'secret' });
});
(0, vitest_1.describe)('getConsumptionOverview', () => {
    (0, vitest_1.it)('uses the monthly total for permanent users and ignores the quota field', async () => {
        const result = await (0, consumptionService_1.getConsumptionOverview)({ username: 'tsou', password: 'secret' });
        (0, vitest_1.expect)(result.summary.accountType).toBe('permanent');
        (0, vitest_1.expect)(result.summary.dataUsed.raw).toBe(Math.round(421.6 * 1024 * 1024 * 1024));
        (0, vitest_1.expect)(result.summary.dataUsed.formatted).toBe('421.60');
        (0, vitest_1.expect)(result.summary.dataRemaining.raw).toBe(Math.round(378.4 * 1024 * 1024 * 1024));
        (0, vitest_1.expect)(result.summary.percDataUsed).toBe(53);
    });
});
//# sourceMappingURL=consumptionService.test.js.map