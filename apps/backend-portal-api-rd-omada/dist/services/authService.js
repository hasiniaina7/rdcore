"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = connect;
const http_errors_1 = __importDefault(require("http-errors"));
const crypto_1 = require("crypto");
const config_1 = __importDefault(require("../config"));
const omadaIntegration_1 = require("./omadaIntegration");
const radiusdeskIntegration_1 = require("./radiusdeskIntegration");
const logger_1 = __importDefault(require("../utils/logger"));
const metrics_1 = require("../utils/metrics");
function ensure(value, message) {
    if (!value) {
        throw (0, http_errors_1.default)(400, message);
    }
}
async function connect(ctx, requestId) {
    const rid = requestId || (0, crypto_1.randomUUID)();
    const basePayload = { ...ctx.omada };
    basePayload.accessToken = ctx.omada.accessToken || ctx.username || ctx.voucherCode || ctx.mac || rid;
    ensure(basePayload.clientMac, 'clientMac is required');
    ensure(basePayload.radioId !== undefined, 'radioId is required');
    // Validation côté RadiusDesk (PermanentUsers / Vouchers / DynamicKey)
    try {
        switch (ctx.mode) {
            case 'permanent':
                ensure(ctx.username, 'username required');
                ensure(ctx.password, 'password required');
                await (0, radiusdeskIntegration_1.findPermanentUser)(ctx.username);
                break;
            case 'voucher':
                ensure(ctx.voucherCode, 'voucher code required');
                await (0, radiusdeskIntegration_1.findVoucher)(ctx.voucherCode);
                break;
            case 'click':
                ensure(ctx.dynamicKey, 'dynamic key required');
                break;
            case 'social':
                ensure(ctx.username, 'social username required');
                break;
            default:
                throw (0, http_errors_1.default)(400, 'Unsupported mode');
        }
    }
    catch (error) {
        logger_1.default.error({ error, requestId: rid, mode: ctx.mode }, 'RadiusDesk verification failed');
        // Si l’erreur vient d’Axios (appel RadiusDesk), essayer de refléter le statut HTTP pour le frontend.
        if (typeof error === 'object' && error && 'response' in error) {
            const errObj = error;
            const status = errObj.response?.status || 502;
            const msg = errObj.response?.data?.message || `RadiusDesk verification failed (HTTP ${status})`;
            throw (0, http_errors_1.default)(status, msg);
        }
        throw (0, http_errors_1.default)(502, 'RadiusDesk verification failed');
    }
    // Si le mode External Web Portal Omada est activé, on doit notifier le contrôleur via extPortal/auth.
    // Sinon (par ex. mode portail local / page importée), on se contente de valider côté RadiusDesk/FreeRADIUS.
    try {
        if (config_1.default.OMADA_EXTERNAL_PORTAL_ENABLED) {
            await (0, omadaIntegration_1.authorizeClient)(basePayload);
        }
        metrics_1.authRequestsTotal.inc({ mode: ctx.mode, status: 'success' });
        const result = {
            status: 'accepted',
            message: 'Access granted',
            nextRedirect: ctx.omada.redirectUrl || config_1.default.PORTAL_SUCCESS_URL,
            omadaSite: ctx.omada.site,
            username: ctx.username || ctx.voucherCode,
            mac: ctx.mac || ctx.omada.clientMac,
            requestId: rid,
        };
        logger_1.default.info({
            requestId: rid,
            mode: ctx.mode,
            username: ctx.username,
            mac: ctx.mac,
            site: ctx.omada.site,
            dynamicKey: ctx.dynamicKey,
        });
        return result;
    }
    catch (error) {
        metrics_1.authRequestsTotal.inc({ mode: ctx.mode, status: 'error' });
        logger_1.default.error({ error, requestId: rid }, 'Omada authorization failed');
        if (typeof error === 'object' && error && 'response' in error) {
            const errObj = error;
            throw (0, http_errors_1.default)(errObj.response?.status || 502, errObj.response?.data?.msg || 'Omada authorization failed');
        }
        throw (0, http_errors_1.default)(502, 'Omada authorization failed');
    }
}
//# sourceMappingURL=authService.js.map