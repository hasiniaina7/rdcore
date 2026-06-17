"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const usageInsightsService_1 = require("./usageInsightsService");
const radiusdeskIntegration_1 = require("./radiusdeskIntegration");
vitest_1.vi.mock('./radiusdeskIntegration', () => ({
    getSessions: vitest_1.vi.fn(),
}));
const mockedGetSessions = vitest_1.vi.mocked(radiusdeskIntegration_1.getSessions);
(0, vitest_1.describe)('usageInsightsService', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.setSystemTime(new Date('2026-06-17T12:00:00.000Z'));
        vitest_1.vi.clearAllMocks();
        const now = Date.now();
        mockedGetSessions.mockResolvedValue({
            items: [
                {
                    acctstarttime: new Date(now - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                    acctsessiontime: 600,
                    acctinputoctets: 1024,
                    acctoutputoctets: 2048,
                    callingstationid: 'AA-BB-CC',
                },
                {
                    acctstarttime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    acctsessiontime: 1200,
                    acctinputoctets: 4096,
                    acctoutputoctets: 1024,
                    callingstationid: 'DD-EE-FF',
                },
                {
                    acctstarttime: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
                    acctsessiontime: 60,
                    acctinputoctets: 512,
                    acctoutputoctets: 512,
                    callingstationid: 'AA-BB-CC',
                },
            ],
        });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)('aggregates sessions across default periods', async () => {
        const result = await (0, usageInsightsService_1.fetchUsageByUsername)('demo@example.com', { historyLimit: 100 });
        (0, vitest_1.expect)(mockedGetSessions).toHaveBeenNthCalledWith(1, 'demo@example.com', 100, { onlyConnected: false });
        (0, vitest_1.expect)(mockedGetSessions).toHaveBeenNthCalledWith(2, 'demo@example.com', 100, { onlyConnected: true });
        (0, vitest_1.expect)(result.username).toBe('demo@example.com');
        (0, vitest_1.expect)(result.macs).toEqual(['AA-BB-CC', 'DD-EE-FF']);
        const hourly = result.periods.find((p) => p.period === 'hourly');
        (0, vitest_1.expect)(hourly).toMatchObject({
            totalBytes: 3072,
            sessionCount: 1,
        });
        const weekly = result.periods.find((p) => p.period === 'weekly');
        (0, vitest_1.expect)(weekly?.sessionCount).toBeGreaterThanOrEqual(2);
        const monthly = result.periods.find((p) => p.period === 'monthly');
        (0, vitest_1.expect)(monthly?.sessionCount).toBe(3);
        (0, vitest_1.expect)(result.series.buckets.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.series.granularity).toBe('day');
    });
    (0, vitest_1.it)('counts monthly usage from the start of the current calendar month', async () => {
        mockedGetSessions.mockResolvedValue({
            items: [
                {
                    acctstarttime: '2026-05-15T10:00:00.000Z',
                    acctsessiontime: 600,
                    acctinputoctets: 1024,
                    acctoutputoctets: 2048,
                    callingstationid: 'AA-BB-CC',
                },
                {
                    acctstarttime: '2026-06-02T10:00:00.000Z',
                    acctsessiontime: 1200,
                    acctinputoctets: 4096,
                    acctoutputoctets: 1024,
                    callingstationid: 'DD-EE-FF',
                },
            ],
        });
        const result = await (0, usageInsightsService_1.fetchUsageByUsername)('demo@example.com', { historyLimit: 100, endDate: new Date('2026-06-17T12:00:00.000Z') });
        const monthly = result.periods.find((p) => p.period === 'monthly');
        (0, vitest_1.expect)(monthly).toMatchObject({
            totalBytes: 5120,
            totalTimeSeconds: 1200,
            sessionCount: 1,
        });
    });
    (0, vitest_1.it)('throws when username is missing', async () => {
        await (0, vitest_1.expect)((0, usageInsightsService_1.fetchUsageByUsername)('', { historyLimit: 100 })).rejects.toThrow('username is required');
    });
    (0, vitest_1.it)('builds timeseries with selected granularity', async () => {
        const start = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const end = new Date();
        const series = await (0, usageInsightsService_1.fetchUsageTimeseries)('demo@example.com', {
            historyLimit: 120,
            granularity: 'hour',
            startDate: start,
            endDate: end,
        });
        (0, vitest_1.expect)(mockedGetSessions).toHaveBeenNthCalledWith(1, 'demo@example.com', 120, { onlyConnected: false });
        (0, vitest_1.expect)(mockedGetSessions).toHaveBeenNthCalledWith(2, 'demo@example.com', 120, { onlyConnected: true });
        (0, vitest_1.expect)(series.granularity).toBe('hour');
        (0, vitest_1.expect)(series.buckets.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=usageInsightsService.test.js.map