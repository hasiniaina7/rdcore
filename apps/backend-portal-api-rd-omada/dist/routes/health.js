"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metrics_1 = __importDefault(require("../utils/metrics"));
const omadaIntegration_1 = require("../services/omadaIntegration");
const dynamicService_1 = require("../services/dynamicService");
const router = (0, express_1.Router)();
router.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', success: true });
});
router.get('/readyz', async (_req, res, next) => {
    try {
        await Promise.all([(0, omadaIntegration_1.readyCheck)(), (0, dynamicService_1.getDynamicDetail)({ healthcheck: '1' })]);
        res.json({ status: 'ready', success: true });
    }
    catch (error) {
        next(error);
    }
});
router.get('/metrics', async (_req, res) => {
    res.set('Content-Type', metrics_1.default.contentType);
    res.send(await metrics_1.default.metrics());
});
exports.default = router;
//# sourceMappingURL=health.js.map