import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics({ register });

export const authRequestsTotal = new Counter({
  name: 'auth_requests_total',
  help: 'Authentication attempts',
  labelNames: ['mode', 'status'],
});

export const radiusdeskLatency = new Histogram({
  name: 'radiusdesk_latency_ms',
  help: 'Latency for RadiusDesk calls',
  labelNames: ['endpoint'],
  buckets: [50, 100, 250, 500, 1000, 2000],
});

export const omadaLatency = new Histogram({
  name: 'omada_latency_ms',
  help: 'Latency for Omada calls',
  labelNames: ['endpoint'],
  buckets: [50, 100, 250, 500, 1000, 2000],
});

export const dynamicCacheGauge = new Gauge({
  name: 'dynamic_detail_cache_entries',
  help: 'Dynamic detail cache entries',
});

export default register;
