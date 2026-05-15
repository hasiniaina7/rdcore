"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('./radiusdeskIntegration', () => ({
    fetchDynamicDetails: vitest_1.vi.fn(async () => ({ success: true, data: { detail: { name: 'Demo' } } })),
}));
vitest_1.vi.mock('../utils/metrics', () => ({
    dynamicCacheGauge: {
        set: vitest_1.vi.fn(),
    },
}));
const dynamicService_1 = require("./dynamicService");
const radiusdeskIntegration_1 = require("./radiusdeskIntegration");
(0, vitest_1.describe)('dynamicService', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        (0, dynamicService_1.resetDynamicDetailCache)();
    });
    (0, vitest_1.it)('injects default language when missing', async () => {
        await (0, dynamicService_1.getDynamicDetail)({ key: 'demo' });
        (0, vitest_1.expect)(radiusdeskIntegration_1.fetchDynamicDetails).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ key: 'demo', language: 'fr_FR' }));
    });
    (0, vitest_1.it)('prefers explicit lang over default', async () => {
        await (0, dynamicService_1.getDynamicDetail)({ lang: 'en_US', clientMac: 'aa-bb' });
        (0, vitest_1.expect)(radiusdeskIntegration_1.fetchDynamicDetails).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ lang: 'en_US', clientMac: 'aa-bb', language: 'en_US' }));
    });
    (0, vitest_1.it)('returns cached payload on repeat queries', async () => {
        const resultA = await (0, dynamicService_1.getDynamicDetail)({ key: 'demo' });
        const resultB = await (0, dynamicService_1.getDynamicDetail)({ key: 'demo' });
        (0, vitest_1.expect)(resultA.data).toEqual(resultB.data);
        (0, vitest_1.expect)(radiusdeskIntegration_1.fetchDynamicDetails).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=dynamicService.test.js.map