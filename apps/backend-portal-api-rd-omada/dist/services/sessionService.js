"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listActiveSessions = listActiveSessions;
exports.listInactiveSessions = listInactiveSessions;
const http_errors_1 = __importDefault(require("http-errors"));
const radiusdeskIntegration_1 = require("./radiusdeskIntegration");
const clampLimit = (value, fallback) => {
    if (!Number.isFinite(value)) {
        return fallback;
    }
    return Math.min(200, Math.max(1, Number(value)));
};
const toArray = (items) => Array.isArray(items) ? items.filter((item) => item && typeof item === 'object') : [];
const toTimestamp = (date, inclusiveEnd = false) => {
    if (!date) {
        return undefined;
    }
    const clone = new Date(date);
    if (inclusiveEnd) {
        clone.setMilliseconds(clone.getMilliseconds() + 999);
    }
    const value = clone.getTime();
    return Number.isNaN(value) ? undefined : value;
};
const parseRecordStart = (record) => {
    const raw = record.acctstarttime ?? record.start_time;
    if (!raw) {
        return undefined;
    }
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
};
const hasStopTime = (record) => {
    const value = record.acctstoptime;
    if (value == null) {
        return false;
    }
    if (typeof record.active === 'boolean') {
        return record.active === false;
    }
    if (typeof value === 'string') {
        const normalized = value.trim();
        if (!normalized || normalized === '0' || normalized === '0000-00-00 00:00:00') {
            return false;
        }
    }
    if (typeof value === 'number') {
        return value > 0;
    }
    return true;
};
const isActiveRecord = (record) => {
    if (typeof record.active === 'boolean') {
        return record.active;
    }
    return !hasStopTime(record);
};
const applyFilters = (records, filters, defaultStatus) => {
    const status = filters.status ?? defaultStatus;
    const start = toTimestamp(filters.startDate);
    const end = toTimestamp(filters.endDate, true);
    return records.filter((record) => {
        if (status === 'active' && !isActiveRecord(record)) {
            return false;
        }
        if (status === 'inactive' && isActiveRecord(record)) {
            return false;
        }
        const startTime = parseRecordStart(record);
        if (start && typeof startTime === 'number' && startTime < start) {
            return false;
        }
        if (end && typeof startTime === 'number' && startTime > end) {
            return false;
        }
        return true;
    });
};
const fetchSessionsWithFallback = async (username, limit, options, macFallback) => {
    const initialResponse = await (0, radiusdeskIntegration_1.getSessions)(username.trim(), limit, options);
    const initialRecords = toArray(initialResponse?.items);
    if (initialRecords.length || !macFallback?.trim()) {
        return { response: initialResponse, records: initialRecords };
    }
    const sanitizedMac = macFallback.trim();
    const fallbackResponse = await (0, radiusdeskIntegration_1.getSessions)('', limit, {
        ...options,
        caseInsensitive: false,
        extraParams: {
            ...(options?.extraParams ?? {}),
            callingstationid: sanitizedMac,
        },
    });
    return { response: fallbackResponse, records: toArray(fallbackResponse?.items) };
};
async function listActiveSessions(username, filters, mac) {
    if (!username?.trim()) {
        throw (0, http_errors_1.default)(400, 'username is required');
    }
    const normalizedLimit = clampLimit(filters?.limit, 20);
    const { response, records } = await fetchSessionsWithFallback(username, normalizedLimit, undefined, mac);
    const filtered = applyFilters(records, filters ?? {}, 'active');
    const sessions = filtered.slice(0, normalizedLimit);
    return {
        username: username.trim(),
        totalCount: sessions.length,
        radiusdeskTotal: typeof response?.totalCount === 'number' ? response.totalCount : filtered.length,
        sessions,
    };
}
async function listInactiveSessions(username, filters, mac) {
    if (!username?.trim()) {
        throw (0, http_errors_1.default)(400, 'username is required');
    }
    const normalizedLimit = clampLimit(filters?.limit, 50);
    const fetchLimit = Math.min(200, normalizedLimit * 2);
    const { response, records } = await fetchSessionsWithFallback(username, fetchLimit, { onlyConnected: false }, mac);
    const filtered = applyFilters(records.filter((item) => !isActiveRecord(item)), filters ?? {}, 'inactive');
    const sessions = filtered.slice(0, normalizedLimit);
    return {
        username: username.trim(),
        totalCount: sessions.length,
        radiusdeskTotal: typeof response?.totalCount === 'number' ? response.totalCount : filtered.length,
        sessions,
    };
}
//# sourceMappingURL=sessionService.js.map