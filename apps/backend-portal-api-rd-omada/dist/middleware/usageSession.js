"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUsageSession = extractUsageSession;
exports.requireUsageSession = requireUsageSession;
const http_errors_1 = __importDefault(require("http-errors"));
const usageSessionStore_1 = require("../services/usageSessionStore");
const BEARER_PREFIX = /^Bearer\s+/i;
function extractUsageSession(req) {
    const authHeader = req.get('authorization');
    if (!authHeader) {
        return null;
    }
    if (!BEARER_PREFIX.test(authHeader)) {
        return null;
    }
    const token = authHeader.replace(BEARER_PREFIX, '').trim();
    if (!token) {
        throw (0, http_errors_1.default)(401, 'Invalid session token');
    }
    const session = (0, usageSessionStore_1.getUsageSession)(token);
    if (!session) {
        throw (0, http_errors_1.default)(401, 'Invalid session token');
    }
    return { token, ...session };
}
function requireUsageSession(req) {
    const session = extractUsageSession(req);
    if (!session) {
        throw (0, http_errors_1.default)(401, 'Session token required');
    }
    return session;
}
//# sourceMappingURL=usageSession.js.map