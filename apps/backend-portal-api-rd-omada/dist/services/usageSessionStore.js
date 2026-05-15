"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUsageSession = createUsageSession;
exports.getUsageSession = getUsageSession;
exports.deleteUsageSession = deleteUsageSession;
const crypto_1 = require("crypto");
const lru_cache_1 = require("lru-cache");
const config_1 = __importDefault(require("../config"));
const ttlMs = config_1.default.USAGE_SESSION_TTL_MINUTES * 60 * 1000;
const sessionStore = new lru_cache_1.LRUCache({
    max: config_1.default.USAGE_SESSION_CACHE_SIZE,
    ttl: ttlMs,
    updateAgeOnGet: true,
});
function createUsageSession(payload) {
    const token = (0, crypto_1.randomBytes)(32).toString('hex');
    sessionStore.set(token, { ...payload });
    const expiresAt = Date.now() + ttlMs;
    return { token, expiresAt };
}
function getUsageSession(token) {
    return sessionStore.get(token) ?? null;
}
function deleteUsageSession(token) {
    sessionStore.delete(token);
}
//# sourceMappingURL=usageSessionStore.js.map