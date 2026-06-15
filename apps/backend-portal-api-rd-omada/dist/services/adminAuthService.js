"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminAuthModes = listAdminAuthModes;
exports.loginAdmin = loginAdmin;
exports.verifyAdminToken = verifyAdminToken;
exports.logoutAdmin = logoutAdmin;
const crypto_1 = __importDefault(require("crypto"));
const LRUCache = require('lru-cache');
const http_errors_1 = __importDefault(require("http-errors"));
const config_1 = __importDefault(require("../config"));
const ttlMs = config_1.default.ADMIN_TOKEN_TTL_MINUTES * 60 * 1000;
const tokenStore = new LRUCache({ ttl: ttlMs, max: 500 });
const isStaticConfigured = Boolean(config_1.default.ADMIN_STATIC_USER && config_1.default.ADMIN_STATIC_PASSWORD);
const isMysqlConfigured = Boolean(config_1.default.RADIUS_MYSQL_USER && config_1.default.RADIUS_MYSQL_PASSWORD);
const availableModes = [];
if (isStaticConfigured) {
    availableModes.push('static');
}
if (isMysqlConfigured) {
    availableModes.push('radiusmysql');
}
const defaultMode = (() => {
    if (availableModes.includes(config_1.default.ADMIN_AUTH_MODE)) {
        return config_1.default.ADMIN_AUTH_MODE;
    }
    return availableModes[0] ?? null;
})();
function getCredentialsForMode(mode) {
    if (mode === 'static') {
        if (!isStaticConfigured || !config_1.default.ADMIN_STATIC_USER || !config_1.default.ADMIN_STATIC_PASSWORD) {
            return null;
        }
        return { username: config_1.default.ADMIN_STATIC_USER, password: config_1.default.ADMIN_STATIC_PASSWORD };
    }
    if (!isMysqlConfigured || !config_1.default.RADIUS_MYSQL_USER || !config_1.default.RADIUS_MYSQL_PASSWORD) {
        return null;
    }
    return { username: config_1.default.RADIUS_MYSQL_USER, password: config_1.default.RADIUS_MYSQL_PASSWORD };
}
function safeCompare(a, b) {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    if (aBuffer.length !== bBuffer.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(aBuffer, bBuffer);
}
function listAdminAuthModes() {
    return {
        availableModes,
        defaultMode,
    };
}
function loginAdmin(username, password, requestedMode) {
    if (!availableModes.length) {
        throw (0, http_errors_1.default)(503, 'Admin authentication is not configured');
    }
    const targetMode = (requestedMode && availableModes.includes(requestedMode) ? requestedMode : defaultMode) ?? availableModes[0];
    const credentials = getCredentialsForMode(targetMode);
    if (!credentials) {
        throw (0, http_errors_1.default)(503, 'Admin mode unavailable');
    }
    if (!safeCompare(username, credentials.username) || !safeCompare(password, credentials.password)) {
        throw (0, http_errors_1.default)(401, 'Invalid administrator credentials');
    }
    const token = crypto_1.default.randomUUID();
    const expiresAt = Date.now() + ttlMs;
    const payload = {
        username: credentials.username,
        mode: targetMode,
        token,
        expiresAt,
    };
    tokenStore.set(token, payload);
    return payload;
}
function verifyAdminToken(token) {
    if (!token) {
        return null;
    }
    return tokenStore.get(token) ?? null;
}
function logoutAdmin(token) {
    tokenStore.delete(token);
}
//# sourceMappingURL=adminAuthService.js.map