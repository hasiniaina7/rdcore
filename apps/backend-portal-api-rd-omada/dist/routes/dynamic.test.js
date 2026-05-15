"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
vitest_1.vi.mock('../services/dynamicService', () => ({
    getDynamicDetail: vitest_1.vi.fn(),
}));
const app_1 = __importDefault(require("../app"));
const dynamicService_1 = require("../services/dynamicService");
const mockedGetDynamicDetail = dynamicService_1.getDynamicDetail;
(0, vitest_1.describe)('GET /api/dynamic/details', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.it)('surfaces success payloads from RadiusDesk', async () => {
        mockedGetDynamicDetail.mockResolvedValue({
            data: { success: true, data: { detail: { name: 'Lobby' } } },
            hit: false,
        });
        const res = await (0, supertest_1.default)(app_1.default).get('/api/dynamic/details?key=lobby');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toEqual({
            success: true,
            data: { detail: { name: 'Lobby' } },
            message: undefined,
        });
        (0, vitest_1.expect)(res.headers['x-cache-status']).toBe('MISS');
    });
    (0, vitest_1.it)('propagates failure payloads to the frontend', async () => {
        mockedGetDynamicDetail.mockResolvedValue({
            data: { success: false, data: { key: 'invalid' }, message: 'not found' },
            hit: true,
        });
        const res = await (0, supertest_1.default)(app_1.default).get('/api/dynamic/details?key=unknown');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toEqual({
            success: false,
            data: { key: 'invalid' },
            message: 'not found',
        });
        (0, vitest_1.expect)(res.headers['x-cache-status']).toBe('HIT');
    });
});
//# sourceMappingURL=dynamic.test.js.map