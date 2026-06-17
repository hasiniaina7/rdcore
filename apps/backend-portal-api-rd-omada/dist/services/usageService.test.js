"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const usageService_1 = require("./usageService");
const radiusdeskIntegration_1 = require("./radiusdeskIntegration");
vitest_1.vi.mock('./radiusdeskIntegration', () => ({
    getUsage: vitest_1.vi.fn(),
    getSessions: vitest_1.vi.fn(),
    kickSessions: vitest_1.vi.fn(),
    findPermanentUser: vitest_1.vi.fn(),
    findVoucher: vitest_1.vi.fn(),
}));
const mockedGetUsage = vitest_1.vi.mocked(radiusdeskIntegration_1.getUsage);
const mockedGetSessions = vitest_1.vi.mocked(radiusdeskIntegration_1.getSessions);
const mockedFindPermanentUser = vitest_1.vi.mocked(radiusdeskIntegration_1.findPermanentUser);
const mockedFindVoucher = vitest_1.vi.mocked(radiusdeskIntegration_1.findVoucher);
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    mockedGetUsage.mockResolvedValue({ data: {} });
    mockedGetSessions.mockResolvedValue({ items: [] });
    mockedFindPermanentUser.mockResolvedValue({ items: [] });
    mockedFindVoucher.mockResolvedValue({ items: [] });
});
(0, vitest_1.describe)('fetchUsage', () => {
    (0, vitest_1.it)('derives the MAC from sessions when it is missing', async () => {
        mockedGetSessions.mockResolvedValue({
            items: [{ callingstationid: 'AA:BB:CC:DD:EE:FF' }],
        });
        await (0, usageService_1.fetchUsage)('user', 'secret', undefined, 5, false);
        (0, vitest_1.expect)(mockedGetSessions).toHaveBeenCalledWith('user', 5);
        (0, vitest_1.expect)(mockedGetUsage).toHaveBeenCalledWith('user', { password: 'secret', mac: 'AA:BB:CC:DD:EE:FF' });
    });
    (0, vitest_1.it)('trims and forwards the MAC address when provided without calling getSessions unnecessarily', async () => {
        await (0, usageService_1.fetchUsage)('user', 'secret', '  AA:BB:CC  ', 10, false);
        (0, vitest_1.expect)(mockedGetUsage).toHaveBeenCalledWith('user', {
            password: 'secret',
            mac: 'AA:BB:CC',
        });
        (0, vitest_1.expect)(mockedGetSessions).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns quota data when no session MAC is available but permanent user info exists', async () => {
        mockedGetSessions.mockResolvedValue({ items: [] });
        mockedFindPermanentUser.mockResolvedValue({
            items: [{ data_used: 123, data_cap: 456, time_cap: 3600 }],
        });
        const result = await (0, usageService_1.fetchUsage)('user', 'secret', undefined, 5, true);
        (0, vitest_1.expect)(result.accountType).toBe('permanent');
        (0, vitest_1.expect)(result.mac).toBeUndefined();
        (0, vitest_1.expect)(result.dataUsed).toBe(123);
        (0, vitest_1.expect)(result.dataCap).toBe(456);
        (0, vitest_1.expect)(result.sessions).toHaveLength(0);
    });
    (0, vitest_1.it)('still throws when no MAC or quota metadata are available', async () => {
        mockedGetSessions.mockResolvedValue({ items: [] });
        mockedFindPermanentUser.mockResolvedValue({ items: [] });
        mockedFindVoucher.mockResolvedValue({ items: [] });
        await (0, vitest_1.expect)((0, usageService_1.fetchUsage)('user', 'secret', undefined, 5, true)).rejects.toThrow('Unable to determine MAC address for this user');
    });
});
//# sourceMappingURL=usageService.test.js.map