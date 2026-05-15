"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicCacheGauge = exports.omadaLatency = exports.radiusdeskLatency = exports.authRequestsTotal = void 0;
const prom_client_1 = require("prom-client");
(0, prom_client_1.collectDefaultMetrics)({ register: prom_client_1.register });
exports.authRequestsTotal = new prom_client_1.Counter({
    name: 'auth_requests_total',
    help: 'Authentication attempts',
    labelNames: ['mode', 'status'],
});
exports.radiusdeskLatency = new prom_client_1.Histogram({
    name: 'radiusdesk_latency_ms',
    help: 'Latency for RadiusDesk calls',
    labelNames: ['endpoint'],
    buckets: [50, 100, 250, 500, 1000, 2000],
});
exports.omadaLatency = new prom_client_1.Histogram({
    name: 'omada_latency_ms',
    help: 'Latency for Omada calls',
    labelNames: ['endpoint'],
    buckets: [50, 100, 250, 500, 1000, 2000],
});
exports.dynamicCacheGauge = new prom_client_1.Gauge({
    name: 'dynamic_detail_cache_entries',
    help: 'Dynamic detail cache entries',
});
exports.default = prom_client_1.register;
//# sourceMappingURL=metrics.js.map