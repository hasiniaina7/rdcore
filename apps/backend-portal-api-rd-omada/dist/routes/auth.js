"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const http_errors_1 = __importDefault(require("http-errors"));
const zod_1 = require("zod");
const loginService_1 = require("../services/loginService");
const router = (0, express_1.Router)();
router.post('/login', async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            username: zod_1.z.string().min(1),
            password: zod_1.z.string().min(1),
            mac: zod_1.z.string().optional(),
        });
        const body = schema.safeParse(req.body);
        if (!body.success) {
            throw (0, http_errors_1.default)(400, 'Invalid credentials payload');
        }
        const result = await (0, loginService_1.loginUsageUser)(body.data);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map