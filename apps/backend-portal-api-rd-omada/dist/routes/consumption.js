"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const http_errors_1 = __importDefault(require("http-errors"));
const consumptionService_1 = require("../services/consumptionService");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
router.post('/consumption/login', async (req, res, next) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            throw (0, http_errors_1.default)(400, 'Invalid credentials payload');
        }
        const data = await (0, consumptionService_1.getConsumptionOverview)(parsed.data);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
const disconnectSchema = zod_1.z.object({
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
    radacctIds: zod_1.z.array(zod_1.z.string()).nonempty(),
});
router.post('/sessions/disconnect', async (req, res, next) => {
    try {
        const parsed = disconnectSchema.safeParse(req.body);
        if (!parsed.success) {
            throw (0, http_errors_1.default)(400, 'Invalid disconnect payload');
        }
        const result = await (0, consumptionService_1.disconnectSessionsWithCredentials)(parsed.data);
        res.json({ success: result.success });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=consumption.js.map