"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const sessionService_1 = require("./sessionService");
const radiusdeskIntegration_1 = require("./radiusdeskIntegration");
vitest_1.vi.mock('./radiusdeskIntegration', () => ({
    getSessions: vitest_1.vi.fn(),
}));
const mockedGetSessions = vitest_1.vi.mocked(radiusdeskIntegration_1.getSessions);
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
(0, vitest_1.describe)('sessionService', () => {
    (0, vitest_1.it)('lists active sessions', async () => {
        mockedGetSessions.mockResolvedValue({
            items: [{ acctstoptime: null }, { acctstoptime: null }],
            totalCount: 2,
        });
        const result = await (0, sessionService_1.listActiveSessions)('demo', { limit: 5 });
        (0, vitest_1.expect)(mockedGetSessions).toHaveBeenCalledWith('demo', 5, undefined);
        (0, vitest_1.expect)(result.sessions).toHaveLength(2);
        (0, vitest_1.expect)(result.radiusdeskTotal).toBe(2);
    });
    (0, vitest_1.it)('filters inactive sessions', async () => {
        mockedGetSessions.mockResolvedValue({
            items: [{ acctstoptime: 'now' }, { acctstoptime: null }, { acctstoptime: 'yesterday' }],
            totalCount: 3,
        });
        const result = await (0, sessionService_1.listInactiveSessions)('demo', { limit: 1 });
        (0, vitest_1.expect)(mockedGetSessions).toHaveBeenCalledWith('demo', 2, { onlyConnected: false });
        (0, vitest_1.expect)(result.sessions).toHaveLength(1);
        (0, vitest_1.expect)(result.sessions[0].acctstoptime).toBe('now');
        (0, vitest_1.expect)(result.totalCount).toBe(1);
    });
    (0, vitest_1.it)('applies date filters to session lists', async () => {
        mockedGetSessions.mockResolvedValue({
            items: [
                { acctstoptime: 'now', acctstarttime: '2024-05-02T10:00:00Z' },
                { acctstoptime: 'old', acctstarttime: '2024-04-20T10:00:00Z' },
            ],
        });
        const result = await (0, sessionService_1.listInactiveSessions)('demo', {
            limit: 5,
            startDate: new Date('2024-05-01T00:00:00Z'),
            endDate: new Date('2024-05-03T23:59:59Z'),
        });
        (0, vitest_1.expect)(result.sessions).toHaveLength(1);
        (0, vitest_1.expect)(result.sessions[0].acctstoptime).toBe('now');
    });
    (0, vitest_1.it)('honors status filter for active sessions', async () => {
        mockedGetSessions.mockResolvedValue({
            items: [{ acctstoptime: null, acctstarttime: '2024-05-02T10:00:00Z' }],
        });
        const result = await (0, sessionService_1.listActiveSessions)('demo', { limit: 5, status: 'inactive' });
        (0, vitest_1.expect)(result.sessions).toHaveLength(0);
    });
    (0, vitest_1.it)('validates username', async () => {
        await (0, vitest_1.expect)((0, sessionService_1.listActiveSessions)('', { limit: 5 })).rejects.toThrow('username is required');
        await (0, vitest_1.expect)((0, sessionService_1.listInactiveSessions)('', { limit: 5 })).rejects.toThrow('username is required');
    });
    (0, vitest_1.it)('treats zero stop times as active', async () => {
        mockedGetSessions.mockResolvedValue({
            items: [{ acctstoptime: '0000-00-00 00:00:00', acctstarttime: '2024-05-02T10:00:00Z' }],
        });
        const result = await (0, sessionService_1.listActiveSessions)('demo', { limit: 5 });
        (0, vitest_1.expect)(result.sessions).toHaveLength(1);
    });
    (0, vitest_1.it)('uses the active flag when provided by RadiusDesk', async () => {
        mockedGetSessions.mockResolvedValue({
            items: [{ acctstoptime: 1205182, active: true, acctstarttime: '2024-05-02T10:00:00Z' }],
        });
        const result = await (0, sessionService_1.listActiveSessions)('demo', { limit: 5 });
        (0, vitest_1.expect)(result.sessions).toHaveLength(1);
    });
    (0, vitest_1.it)('falls back to MAC-based lookup when username query is empty', async () => {
        mockedGetSessions
            .mockResolvedValueOnce({ items: [], totalCount: 0 })
            .mockResolvedValueOnce({ items: [{ acctstoptime: null }], totalCount: 1 });
        const result = await (0, sessionService_1.listActiveSessions)('Demo', { limit: 5 }, 'AA-BB-CC-11-22-33');
        (0, vitest_1.expect)(mockedGetSessions).toHaveBeenNthCalledWith(1, 'Demo', 5, undefined);
        (0, vitest_1.expect)(mockedGetSessions).toHaveBeenNthCalledWith(2, '', 5, vitest_1.expect.objectContaining({
            caseInsensitive: false,
            extraParams: vitest_1.expect.objectContaining({ callingstationid: 'AA-BB-CC-11-22-33' }),
        }));
        (0, vitest_1.expect)(result.sessions).toHaveLength(1);
    });
});
//# sourceMappingURL=sessionService.test.js.map