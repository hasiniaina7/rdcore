"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDynamicDetail = getDynamicDetail;
exports.resetDynamicDetailCache = resetDynamicDetailCache;
const lru_cache_1 = require("lru-cache");
const radiusdeskIntegration_1 = require("./radiusdeskIntegration");
const config_1 = __importDefault(require("../config"));
const metrics_1 = require("../utils/metrics");
const cache = new lru_cache_1.LRUCache({
    ttl: 15 * 1000,
    allowStale: false,
    max: 100,
});
function normalizeQuery(query) {
    const normalized = { ...query };
    if (!normalized.language && normalized.lang) {
        normalized.language = normalized.lang;
    }
    if (!normalized.language && config_1.default.DEFAULT_LANGUAGE) {
        normalized.language = config_1.default.DEFAULT_LANGUAGE;
    }
    return normalized;
}
async function getDynamicDetail(query) {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = JSON.stringify(normalizedQuery);
    if (cache.has(cacheKey)) {
        return { data: cache.get(cacheKey), hit: true };
    }
    const detail = await (0, radiusdeskIntegration_1.fetchDynamicDetails)(normalizedQuery);
    cache.set(cacheKey, detail);
    metrics_1.dynamicCacheGauge.set(cache.size);
    return { data: detail, hit: false };
}
function resetDynamicDetailCache() {
    cache.clear();
    metrics_1.dynamicCacheGauge.set(cache.size);
}
//# sourceMappingURL=dynamicService.js.map