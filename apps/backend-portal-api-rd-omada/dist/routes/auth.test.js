"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
vitest_1.vi.mock('../services/loginService', () => ({
    loginUsageUser: vitest_1.vi.fn(),
}));
const app_1 = __importDefault(require("../app"));
const loginService_1 = require("../services/loginService");
const mockedLoginUsageUser = loginService_1.loginUsageUser;
(0, vitest_1.describe)('POST /api/login', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.it)('creates a usage session token upon successful login', async () => {
        mockedLoginUsageUser.mockResolvedValue({
            token: 'session-token',
            expiresAt: 123,
            profile: { username: 'bob', mac: '00:11:22' },
        });
        const res = await (0, supertest_1.default)(app_1.default).post('/api/login').send({ username: 'bob', password: 'secret' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toEqual({
            success: true,
            data: {
                token: 'session-token',
                expiresAt: 123,
                profile: { username: 'bob', mac: '00:11:22' },
            },
        });
        (0, vitest_1.expect)(mockedLoginUsageUser).toHaveBeenCalledWith({ username: 'bob', password: 'secret' });
    });
    (0, vitest_1.it)('validates required fields', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/login').send({ username: '' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(mockedLoginUsageUser).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=auth.test.js.map