"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const http_errors_1 = __importDefault(require("http-errors"));
vitest_1.vi.mock('../services/usageService', () => ({
    fetchUsage: vitest_1.vi.fn(),
    disconnectSessions: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../services/sessionService', () => ({
    listActiveSessions: vitest_1.vi.fn(),
    listInactiveSessions: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../services/usageInsightsService', () => ({
    fetchUsageByUsername: vitest_1.vi.fn(),
    fetchUsageTimeseries: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../middleware/usageSession', () => ({
    extractUsageSession: vitest_1.vi.fn(),
    requireUsageSession: vitest_1.vi.fn(),
}));
const app_1 = __importDefault(require("../app"));
const usageService_1 = require("../services/usageService");
const sessionService_1 = require("../services/sessionService");
const usageInsightsService_1 = require("../services/usageInsightsService");
const usageSession_1 = require("../middleware/usageSession");
const mockedFetchUsage = usageService_1.fetchUsage;
const mockedDisconnectSessions = usageService_1.disconnectSessions;
const mockedListActiveSessions = sessionService_1.listActiveSessions;
const mockedListInactiveSessions = sessionService_1.listInactiveSessions;
const mockedFetchUsageByUsername = usageInsightsService_1.fetchUsageByUsername;
const mockedFetchUsageTimeseries = usageInsightsService_1.fetchUsageTimeseries;
const mockedExtractUsageSession = usageSession_1.extractUsageSession;
const mockedRequireUsageSession = usageSession_1.requireUsageSession;
(0, vitest_1.describe)('usage routes', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.it)('prefers session credentials for /usage', async () => {
        mockedExtractUsageSession.mockReturnValue({
            username: 'alice',
            password: 'pw',
            mac: '00:11',
        });
        mockedFetchUsage.mockResolvedValue({ username: 'alice', mac: '00:11' });
        const res = await (0, supertest_1.default)(app_1.default).get('/api/usage?limit=5&withSessions=false');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(mockedFetchUsage).toHaveBeenCalledWith('alice', 'pw', '00:11', 5, false);
    });
    (0, vitest_1.it)('falls back to explicit credentials when no session token is provided', async () => {
        mockedExtractUsageSession.mockReturnValue(null);
        mockedFetchUsage.mockResolvedValue({ username: 'bob', mac: 'aa:bb' });
        const res = await (0, supertest_1.default)(app_1.default).get('/api/usage?username=bob&password=secret&limit=5');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(mockedFetchUsage).toHaveBeenCalledWith('bob', 'secret', undefined, 5, true);
    });
    (0, vitest_1.it)('requires a session token for derived usage endpoints', async () => {
        mockedRequireUsageSession.mockReturnValue({
            username: 'alice',
            password: 'pw',
            mac: 'ff:ee',
        });
        mockedFetchUsageByUsername.mockResolvedValue({
            username: 'alice',
            historyLimit: 100,
            macs: [],
            periods: [],
            series: { startDate: '', endDate: '', granularity: 'day', buckets: [] },
        });
        mockedListActiveSessions.mockResolvedValue({ sessions: [] });
        mockedListInactiveSessions.mockResolvedValue({ sessions: [] });
        const summaryRes = await (0, supertest_1.default)(app_1.default).get('/api/usage-by-username');
        const activeRes = await (0, supertest_1.default)(app_1.default).get('/api/active-sessions');
        const inactiveRes = await (0, supertest_1.default)(app_1.default).get('/api/inactive-sessions');
        (0, vitest_1.expect)(summaryRes.status).toBe(200);
        (0, vitest_1.expect)(activeRes.status).toBe(200);
        (0, vitest_1.expect)(inactiveRes.status).toBe(200);
        (0, vitest_1.expect)(mockedFetchUsageByUsername).toHaveBeenCalledWith('alice', vitest_1.expect.objectContaining({ historyLimit: undefined, granularity: undefined }));
        (0, vitest_1.expect)(mockedListActiveSessions).toHaveBeenCalledWith('alice', vitest_1.expect.objectContaining({ limit: undefined, status: undefined }), 'ff:ee');
        (0, vitest_1.expect)(mockedListInactiveSessions).toHaveBeenCalledWith('alice', vitest_1.expect.objectContaining({ limit: undefined, status: undefined }), 'ff:ee');
    });
    (0, vitest_1.it)('rejects requests when the session token is missing', async () => {
        mockedRequireUsageSession.mockImplementation(() => {
            throw (0, http_errors_1.default)(401, 'Session token required');
        });
        const res = await (0, supertest_1.default)(app_1.default).get('/api/usage-by-username');
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(mockedFetchUsageByUsername).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('checks session existence before disconnecting sessions', async () => {
        mockedRequireUsageSession.mockReturnValue({
            username: 'alice',
            password: 'pw',
        });
        mockedDisconnectSessions.mockResolvedValue(undefined);
        const res = await (0, supertest_1.default)(app_1.default).post('/api/usage/disconnect').send({ radacctIds: ['1'] });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(mockedDisconnectSessions).toHaveBeenCalledWith(['1']);
    });
    (0, vitest_1.it)('passes time filters to insights endpoints', async () => {
        mockedRequireUsageSession.mockReturnValue({ username: 'alice', mac: 'aa:bb' });
        mockedFetchUsageByUsername.mockResolvedValue({
            username: 'alice',
            historyLimit: 123,
            macs: [],
            periods: [],
            series: { startDate: '', endDate: '', granularity: 'day', buckets: [] },
        });
        const res = await (0, supertest_1.default)(app_1.default).get('/api/usage-by-username?historyLimit=250&startDate=2024-05-01&endDate=2024-05-07&granularity=hour');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(mockedFetchUsageByUsername).toHaveBeenCalledTimes(1);
        const [, options] = mockedFetchUsageByUsername.mock.calls[0];
        (0, vitest_1.expect)(options).toMatchObject({
            historyLimit: 250,
            granularity: 'hour',
        });
        (0, vitest_1.expect)(options?.startDate).toEqual(new Date('2024-05-01T00:00:00.000Z'));
        (0, vitest_1.expect)(options?.endDate).toEqual(new Date('2024-05-07T00:00:00.000Z'));
    });
    (0, vitest_1.it)('returns usage timeseries data', async () => {
        mockedRequireUsageSession.mockReturnValue({ username: 'alice', mac: 'aa:bb' });
        mockedFetchUsageTimeseries.mockResolvedValue({
            startDate: '2024-05-01T00:00:00.000Z',
            endDate: '2024-05-07T23:59:59.000Z',
            granularity: 'day',
            buckets: [],
        });
        const res = await (0, supertest_1.default)(app_1.default).get('/api/usage/timeseries?granularity=day');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(mockedFetchUsageTimeseries).toHaveBeenCalledWith('alice', vitest_1.expect.objectContaining({ granularity: 'day' }));
        (0, vitest_1.expect)(res.body.data.granularity).toBe('day');
    });
    (0, vitest_1.it)('forwards filters to session list endpoints', async () => {
        mockedRequireUsageSession.mockReturnValue({ username: 'alice', mac: 'aa:bb' });
        mockedListActiveSessions.mockResolvedValue({ sessions: [] });
        mockedListInactiveSessions.mockResolvedValue({ sessions: [] });
        const activeRes = await (0, supertest_1.default)(app_1.default).get('/api/active-sessions?limit=10&startDate=2024-05-01&endDate=2024-05-07&status=inactive');
        (0, vitest_1.expect)(activeRes.status).toBe(200);
        (0, vitest_1.expect)(mockedListActiveSessions).toHaveBeenCalledWith('alice', vitest_1.expect.objectContaining({ limit: 10, status: 'inactive' }), 'aa:bb');
        const [, activeOptions] = mockedListActiveSessions.mock.calls[0];
        (0, vitest_1.expect)(activeOptions?.startDate).toEqual(new Date('2024-05-01T00:00:00.000Z'));
        (0, vitest_1.expect)(activeOptions?.endDate).toEqual(new Date('2024-05-07T00:00:00.000Z'));
    });
});
//# sourceMappingURL=usage.test.js.map