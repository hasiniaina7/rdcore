"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const axiosMocks = vitest_1.vi.hoisted(() => ({
    get: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('axios', () => ({
    default: {
        create: vitest_1.vi.fn(() => ({
            get: axiosMocks.get,
        })),
    },
}));
const getMock = axiosMocks.get;
const radiusdeskIntegration_1 = require("./radiusdeskIntegration");
(0, vitest_1.describe)('radiusdeskIntegration.getSessions', () => {
    (0, vitest_1.beforeEach)(() => {
        getMock.mockReset();
        getMock.mockResolvedValue({ data: {} });
    });
    (0, vitest_1.it)('applies default sorting by start time desc', async () => {
        await (0, radiusdeskIntegration_1.getSessions)('user', 10);
        const [, options] = getMock.mock.calls[0];
        (0, vitest_1.expect)(options.params.sort).toBe('acctstarttime');
        (0, vitest_1.expect)(options.params.dir).toBe('DESC');
    });
    (0, vitest_1.it)('allows overriding sort settings via extra params', async () => {
        await (0, radiusdeskIntegration_1.getSessions)('user', 10, { extraParams: { sort: 'realm', dir: 'ASC' } });
        const [, options] = getMock.mock.calls[0];
        (0, vitest_1.expect)(options.params.sort).toBe('realm');
        (0, vitest_1.expect)(options.params.dir).toBe('ASC');
    });
    (0, vitest_1.it)('retries with lowercase username when the first attempt is empty', async () => {
        getMock.mockResolvedValueOnce({ data: { items: [] } });
        getMock.mockResolvedValueOnce({ data: { items: [{ id: 1 }] } });
        await (0, radiusdeskIntegration_1.getSessions)('Zambey', 10);
        (0, vitest_1.expect)(getMock).toHaveBeenCalledTimes(2);
        const secondCallParams = getMock.mock.calls[1][1].params;
        (0, vitest_1.expect)(secondCallParams.username).toBe('zambey');
    });
    (0, vitest_1.it)('avoids duplicate requests when username already matches stored case', async () => {
        getMock.mockResolvedValueOnce({ data: { items: [{ id: 1 }] } });
        await (0, radiusdeskIntegration_1.getSessions)('nolimit', 5);
        (0, vitest_1.expect)(getMock).toHaveBeenCalledTimes(1);
        const [, options] = getMock.mock.calls[0];
        (0, vitest_1.expect)(options.params.username).toBe('nolimit');
    });
});
//# sourceMappingURL=radiusdeskIntegration.test.js.map