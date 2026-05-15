"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUsageByUsername = fetchUsageByUsername;
exports.fetchUsageTimeseries = fetchUsageTimeseries;
const http_errors_1 = __importDefault(require("http-errors"));
const radiusdeskIntegration_1 = require("./radiusdeskIntegration");
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const PERIODS = [
    { period: 'hourly', windowMs: HOUR_MS },
    { period: 'daily', windowMs: DAY_MS },
    { period: 'weekly', windowMs: 7 * DAY_MS },
    { period: 'monthly', windowMs: 30 * DAY_MS },
];
const DEFAULT_WINDOWS = {
    hour: 24 * HOUR_MS,
    day: 7 * DAY_MS,
    month: 30 * DAY_MS,
};
const MAX_BUCKETS = {
    hour: 24 * 14, // limit hourly ranges to two weeks
    day: 120, // roughly four months of day buckets
    month: 62, // two months of month-day buckets
};
const clampHistoryLimit = (value) => {
    if (!Number.isFinite(value)) {
        return 200;
    }
    return Math.min(500, Math.max(50, Number(value)));
};
const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};
const pickMac = (record) => {
    const raw = record.callingstationid ??
        record.callingstationmac ??
        record.mac ??
        record.device_mac ??
        record.clientMac ??
        record.client_mac;
    if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
    }
    return undefined;
};
const parseDate = (value) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.getTime();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const timestamp = Date.parse(value);
        return Number.isNaN(timestamp) ? undefined : timestamp;
    }
    return undefined;
};
const alignToUnitStart = (value, granularity) => {
    const date = new Date(value);
    if (granularity === 'hour') {
        date.setMinutes(0, 0, 0);
    }
    else {
        date.setHours(0, 0, 0, 0);
    }
    return date.getTime();
};
const alignToUnitEnd = (value, granularity, bucketSize) => alignToUnitStart(value, granularity) + bucketSize - 1;
const normalizeRange = (options) => {
    const granularity = options?.granularity ?? 'day';
    const bucketSize = granularity === 'hour' ? HOUR_MS : DAY_MS;
    const defaultWindow = DEFAULT_WINDOWS[granularity];
    const inputEnd = options?.endDate ? options.endDate.getTime() : Date.now();
    const inputStart = options?.startDate ? options.startDate.getTime() : inputEnd - defaultWindow;
    const rawStart = Math.min(inputStart, inputEnd);
    const rawEnd = Math.max(inputStart, inputEnd);
    let start = alignToUnitStart(rawStart, granularity);
    let end = alignToUnitEnd(rawEnd, granularity, bucketSize);
    const maxSpan = bucketSize * MAX_BUCKETS[granularity];
    if (end - start >= maxSpan) {
        end = start + maxSpan - 1;
    }
    let bucketCount = Math.floor((end - start) / bucketSize) + 1;
    if (bucketCount < 1) {
        bucketCount = 1;
        end = start + bucketSize - 1;
    }
    else {
        end = start + bucketSize * bucketCount - 1;
    }
    return {
        granularity,
        bucketSize,
        start,
        end,
        bucketCount,
    };
};
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const formatBucketLabel = (timestamp, granularity) => {
    const date = new Date(timestamp);
    if (granularity === 'hour') {
        return `${String(date.getHours()).padStart(2, '0')}:00`;
    }
    if (granularity === 'day') {
        return WEEKDAY_LABELS[date.getDay()];
    }
    return String(date.getDate()).padStart(2, '0');
};
const createTimeseriesBuilder = (options) => {
    const config = normalizeRange(options);
    const buckets = Array.from({ length: config.bucketCount }, (_value, index) => {
        const bucketStart = config.start + index * config.bucketSize;
        const bucketEnd = Math.min(config.end, bucketStart + config.bucketSize - 1);
        return {
            index,
            label: formatBucketLabel(bucketStart, config.granularity),
            start: new Date(bucketStart).toISOString(),
            end: new Date(bucketEnd).toISOString(),
            totalBytes: 0,
            totalTimeSeconds: 0,
            sessionCount: 0,
        };
    });
    return {
        addSample(timestamp, bytes, durationSeconds) {
            if (!Number.isFinite(timestamp) || timestamp < config.start || timestamp > config.end) {
                return;
            }
            const relative = Math.floor((timestamp - config.start) / config.bucketSize);
            const bucket = buckets[relative];
            if (!bucket) {
                return;
            }
            bucket.totalBytes += bytes;
            bucket.totalTimeSeconds += durationSeconds;
            bucket.sessionCount += 1;
        },
        series: {
            startDate: new Date(config.start).toISOString(),
            endDate: new Date(config.end).toISOString(),
            granularity: config.granularity,
            buckets,
        },
    };
};
const computePeriodSummaries = (items, now) => {
    const periodStates = PERIODS.map((period) => ({
        period: period.period,
        since: now - period.windowMs,
        totalBytes: 0,
        totalTimeSeconds: 0,
        sessionCount: 0,
    }));
    for (const entry of items) {
        const start = parseDate(entry.acctstarttime ?? entry.start_time);
        if (!start) {
            continue;
        }
        const bytes = toNumber(entry.acctinputoctets) + toNumber(entry.acctoutputoctets);
        const duration = toNumber(entry.acctsessiontime);
        for (const state of periodStates) {
            if (start >= state.since) {
                state.totalBytes += bytes;
                state.totalTimeSeconds += duration;
                state.sessionCount += 1;
            }
        }
    }
    return periodStates.map((state) => ({
        period: state.period,
        totalBytes: state.totalBytes,
        totalTimeSeconds: state.totalTimeSeconds,
        sessionCount: state.sessionCount,
    }));
};
const normalizeOptions = (input) => {
    if (typeof input === 'number') {
        return { historyLimit: input };
    }
    return input ?? {};
};
const extractSessions = (payload) => Array.isArray(payload) ? payload : [];
async function fetchUsageByUsername(username, optionsInput) {
    if (!username?.trim()) {
        throw (0, http_errors_1.default)(400, 'username is required');
    }
    const options = normalizeOptions(optionsInput);
    const normalizedLimit = clampHistoryLimit(options.historyLimit);
    const sessionsResponse = await (0, radiusdeskIntegration_1.getSessions)(username.trim(), normalizedLimit, { onlyConnected: false });
    const items = extractSessions(sessionsResponse?.items);
    const macs = new Set();
    const now = options.endDate?.getTime() ?? Date.now();
    const periods = computePeriodSummaries(items, now);
    const timeseriesBuilder = createTimeseriesBuilder(options);
    for (const entry of items) {
        if (!entry || typeof entry !== 'object') {
            continue;
        }
        const start = parseDate(entry.acctstarttime ?? entry.start_time);
        if (!start) {
            continue;
        }
        const bytes = toNumber(entry.acctinputoctets) + toNumber(entry.acctoutputoctets);
        const duration = toNumber(entry.acctsessiontime);
        const mac = pickMac(entry);
        if (mac) {
            macs.add(mac);
        }
        timeseriesBuilder.addSample(start, bytes, duration);
    }
    return {
        username: username.trim(),
        historyLimit: normalizedLimit,
        macs: Array.from(macs),
        periods,
        series: timeseriesBuilder.series,
    };
}
async function fetchUsageTimeseries(username, options) {
    if (!username?.trim()) {
        throw (0, http_errors_1.default)(400, 'username is required');
    }
    const normalizedLimit = clampHistoryLimit(options?.historyLimit);
    const sessionsResponse = await (0, radiusdeskIntegration_1.getSessions)(username.trim(), normalizedLimit, { onlyConnected: false });
    const items = extractSessions(sessionsResponse?.items);
    const builder = createTimeseriesBuilder(options);
    for (const entry of items) {
        if (!entry || typeof entry !== 'object') {
            continue;
        }
        const start = parseDate(entry.acctstarttime ?? entry.start_time);
        if (!start) {
            continue;
        }
        const bytes = toNumber(entry.acctinputoctets) + toNumber(entry.acctoutputoctets);
        const duration = toNumber(entry.acctsessiontime);
        builder.addSample(start, bytes, duration);
    }
    return builder.series;
}
//# sourceMappingURL=usageInsightsService.js.map