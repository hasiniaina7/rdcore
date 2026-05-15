"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const adminAuthService_1 = require("../services/adminAuthService");
const adminAuth_1 = require("../middleware/adminAuth");
const adminInsightsService_1 = require("../services/adminInsightsService");
const router = (0, express_1.Router)();
router.get('/admin/auth-modes', (_req, res) => {
    const modes = (0, adminAuthService_1.listAdminAuthModes)();
    res.json({ success: true, data: modes });
});
router.post('/admin/login', (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            username: zod_1.z.string().min(1),
            password: zod_1.z.string().min(1),
            mode: zod_1.z.enum(['static', 'radiusmysql']).optional(),
        });
        const body = schema.parse(req.body);
        const session = (0, adminAuthService_1.loginAdmin)(body.username, body.password, body.mode);
        res.json({
            success: true,
            data: {
                token: session.token,
                expiresAt: session.expiresAt,
                mode: session.mode,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/admin/me', adminAuth_1.requireAdminAuth, (req, res) => {
    res.json({ success: true, data: req.adminSession });
});
router.post('/admin/logout', adminAuth_1.requireAdminAuth, (req, res) => {
    const token = req.adminTokenValue;
    if (token) {
        (0, adminAuthService_1.logoutAdmin)(token);
    }
    res.json({ success: true });
});
router.get('/admin/users/:username/insights', adminAuth_1.requireAdminAuth, async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            username: zod_1.z.string().min(1),
            historyLimit: zod_1.z.coerce.number().optional(),
        });
        const params = schema.parse({ ...req.params, ...req.query });
        const insights = await (0, adminInsightsService_1.fetchAdminUserInsights)(params.username, params.historyLimit);
        res.json({ success: true, data: insights });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map