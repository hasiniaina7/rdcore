"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const router = (0, express_1.Router)();
const omadaSchema = zod_1.z.object({
    clientMac: zod_1.z.string(),
    site: zod_1.z.string().optional(),
    radioId: zod_1.z.number(),
    time: zod_1.z.number().default(() => Date.now() * 1000),
    authType: zod_1.z.number().default(4),
    redirectUrl: zod_1.z.string().optional(),
    apMac: zod_1.z.string().optional(),
    gatewayMac: zod_1.z.string().optional(),
    ssidName: zod_1.z.string().optional(),
    vid: zod_1.z.number().optional(),
});
const bodySchema = zod_1.z.object({
    username: zod_1.z.string().optional(),
    password: zod_1.z.string().optional(),
    voucherCode: zod_1.z.string().optional(),
    mac: zod_1.z.string().optional(),
    dynamicKey: zod_1.z.string().optional(),
    omada: omadaSchema,
});
router.post('/connect/:mode(permanent|voucher|click|social)', async (req, res, next) => {
    try {
        const payload = bodySchema.parse(req.body);
        const mode = req.params.mode;
        const result = await (0, authService_1.connect)({
            mode,
            username: payload.username,
            password: payload.password,
            voucherCode: payload.voucherCode,
            mac: payload.mac,
            dynamicKey: payload.dynamicKey,
            omada: { ...payload.omada, accessToken: payload.omada.clientMac },
        }, req.requestId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=connect.js.map