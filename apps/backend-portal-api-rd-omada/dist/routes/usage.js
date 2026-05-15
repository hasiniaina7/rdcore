"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usageService_1 = require("../services/usageService");
const sessionService_1 = require("../services/sessionService");
const usageInsightsService_1 = require("../services/usageInsightsService");
const zod_1 = require("zod");
const usageSession_1 = require("../middleware/usageSession");
const router = (0, express_1.Router)();
const booleanFromQuery = zod_1.z
    .union([zod_1.z.string(), zod_1.z.boolean(), zod_1.z.number()])
    .transform((value) => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    const normalized = value.trim().toLowerCase();
    if (['false', '0', 'no'].includes(normalized)) {
        return false;
    }
    if (['true', '1', 'yes'].includes(normalized)) {
        return true;
    }
    return Boolean(normalized);
});
const dateFromQuery = zod_1.z.coerce.date().optional();
const granularityParam = zod_1.z.enum(['hour', 'day', 'month']).optional();
const sessionStatusParam = zod_1.z.enum(['all', 'active', 'inactive']).optional();
router.get('/usage', async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            mac: zod_1.z.string().optional(),
            limit: zod_1.z.coerce.number().min(1).max(50).default(10),
            withSessions: booleanFromQuery.optional().default(true),
        });
        const params = schema.parse(req.query);
        const session = (0, usageSession_1.extractUsageSession)(req);
        const credentials = session
            ? {
                username: session.username,
                password: session.password,
                mac: session.mac,
            }
            : (() => {
                const authSchema = zod_1.z.object({
                    username: zod_1.z.string(),
                    password: zod_1.z.string(),
                    mac: zod_1.z.string().optional(),
                });
                const auth = authSchema.parse(req.query);
                return auth;
            })();
        const mac = params.mac || credentials.mac;
        const data = await (0, usageService_1.fetchUsage)(credentials.username, credentials.password, mac, params.limit, params.withSessions);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
router.post('/usage/disconnect', async (req, res, next) => {
    try {
        (0, usageSession_1.requireUsageSession)(req);
        const schema = zod_1.z.object({
            radacctIds: zod_1.z.array(zod_1.z.string()).nonempty(),
        });
        const body = schema.parse(req.body);
        await (0, usageService_1.disconnectSessions)(body.radacctIds);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
router.get('/usage-by-username', async (req, res, next) => {
    try {
        const session = (0, usageSession_1.requireUsageSession)(req);
        const schema = zod_1.z.object({
            historyLimit: zod_1.z.coerce.number().optional(),
            startDate: dateFromQuery,
            endDate: dateFromQuery,
            granularity: granularityParam,
        });
        const params = schema.parse(req.query);
        const data = await (0, usageInsightsService_1.fetchUsageByUsername)(session.username, {
            historyLimit: params.historyLimit,
            startDate: params.startDate,
            endDate: params.endDate,
            granularity: params.granularity,
        });
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
router.get('/usage/timeseries', async (req, res, next) => {
    try {
        const session = (0, usageSession_1.requireUsageSession)(req);
        const schema = zod_1.z.object({
            historyLimit: zod_1.z.coerce.number().optional(),
            startDate: dateFromQuery,
            endDate: dateFromQuery,
            granularity: granularityParam,
        });
        const params = schema.parse(req.query);
        const data = await (0, usageInsightsService_1.fetchUsageTimeseries)(session.username, {
            historyLimit: params.historyLimit,
            startDate: params.startDate,
            endDate: params.endDate,
            granularity: params.granularity,
        });
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
router.get('/active-sessions', async (req, res, next) => {
    try {
        const session = (0, usageSession_1.requireUsageSession)(req);
        const schema = zod_1.z.object({
            limit: zod_1.z.coerce.number().optional(),
            startDate: dateFromQuery,
            endDate: dateFromQuery,
            status: sessionStatusParam,
        });
        const params = schema.parse(req.query);
        const data = await (0, sessionService_1.listActiveSessions)(session.username, {
            limit: params.limit,
            startDate: params.startDate,
            endDate: params.endDate,
            status: params.status,
        }, session.mac);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
router.get('/inactive-sessions', async (req, res, next) => {
    try {
        const session = (0, usageSession_1.requireUsageSession)(req);
        const schema = zod_1.z.object({
            limit: zod_1.z.coerce.number().optional(),
            startDate: dateFromQuery,
            endDate: dateFromQuery,
            status: sessionStatusParam,
        });
        const params = schema.parse(req.query);
        const data = await (0, sessionService_1.listInactiveSessions)(session.username, {
            limit: params.limit,
            startDate: params.startDate,
            endDate: params.endDate,
            status: params.status,
        }, session.mac);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=usage.js.map