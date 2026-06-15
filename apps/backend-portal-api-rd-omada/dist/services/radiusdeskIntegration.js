"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDynamicDetails = fetchDynamicDetails;
exports.getUsage = getUsage;
exports.getSessions = getSessions;
exports.kickSessions = kickSessions;
exports.findPermanentUser = findPermanentUser;
exports.getPermanentUserPassword = getPermanentUserPassword;
exports.findVoucher = findVoucher;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const metrics_1 = require("../utils/metrics");
const radiusClient = axios_1.default.create({
    baseURL: config_1.default.RADIUS_BASE_URL,
    timeout: config_1.default.RADIUS_HTTP_TIMEOUT_MS,
});
const withDefaults = (params) => ({
    token: config_1.default.RADIUS_TOKEN_LOCAL,
    cloud_id: config_1.default.RADIUS_CLOUD_ID,
    ...params,
});
const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
};
const normalizeUsagePayload = (payload) => {
    if (!payload?.data) {
        return payload;
    }
    const normalized = {
        ...payload.data,
        data_used: toNumber(payload.data.data_used),
        data_cap: payload.data.data_cap === null ? null : toNumber(payload.data.data_cap),
        time_used: toNumber(payload.data.time_used),
        time_cap: payload.data.time_cap === null ? null : toNumber(payload.data.time_cap),
    };
    return { ...payload, data: normalized };
};
async function timedRequest(fn, label) {
    const end = metrics_1.radiusdeskLatency.startTimer({ endpoint: label });
    try {
        return await fn();
    }
    finally {
        end();
    }
}
async function fetchDynamicDetails(query) {
    return timedRequest(async () => {
        const { data } = await radiusClient.get('/dynamic-details/info-for.json', {
            params: withDefaults(query),
        });
        return data;
    }, 'dynamic-details');
}
async function getUsage(username, options) {
    return timedRequest(async () => {
        const params = {
            username,
            password: options.password,
        };
        if (options.mac) {
            params.mac = options.mac;
        }
        const { data } = await radiusClient.get('/radaccts/get-usage.json', {
            params: withDefaults(params),
        });
        return normalizeUsagePayload(data);
    }, 'get-usage');
}
const buildUsernameAttempts = (rawUsername, caseInsensitive) => {
    const normalized = rawUsername?.trim();
    if (!normalized) {
        return [normalized];
    }
    if (!caseInsensitive) {
        return [normalized];
    }
    const candidates = new Set([normalized, normalized.toLowerCase(), normalized.toUpperCase()]);
    return Array.from(candidates);
};
async function getSessions(username, limit = 10, options) {
    const { onlyConnected, page = 1, start = 0, extraParams = {}, caseInsensitive = true } = options ?? {};
    const attemptRequest = async (usernameParam) => {
        const params = {
            limit,
            page,
            start,
            sort: 'acctstarttime',
            dir: 'DESC',
            ...extraParams,
        };
        if (usernameParam) {
            params.username = usernameParam;
        }
        if (typeof onlyConnected === 'boolean') {
            params.only_connected = onlyConnected ? 'true' : 'false';
        }
        const { data } = await radiusClient.get('/radaccts/index.json', {
            params: withDefaults(params),
        });
        return data;
    };
    const attempts = buildUsernameAttempts(username, caseInsensitive);
    let lastResponse;
    for (const candidate of attempts) {
        lastResponse = await timedRequest(() => attemptRequest(candidate), 'sessions');
        const items = Array.isArray(lastResponse?.items) ? lastResponse.items : [];
        if (!caseInsensitive || items.length > 0) {
            return lastResponse;
        }
    }
    return lastResponse ?? (await timedRequest(() => attemptRequest(username?.trim()), 'sessions'));
}
async function kickSessions(radacctIds) {
    const params = radacctIds.reduce((acc, id) => {
        acc[id] = '1';
        return acc;
    }, {});
    await timedRequest(async () => {
        await radiusClient.get('/radaccts/kick-active.json', {
            params: withDefaults(params),
        });
    }, 'kick-active');
}
async function findPermanentUser(username) {
    return timedRequest(async () => {
        const filter = JSON.stringify([
            {
                property: 'username',
                operator: 'like',
                value: username,
            },
        ]);
        const { data } = await radiusClient.get('/permanent-users/index.json', {
            params: withDefaults({ limit: 20, page: 1, start: 0, filter }),
        });
        return data;
    }, 'permanent-users');
}
async function getPermanentUserPassword(userId) {
    return timedRequest(async () => {
        const { data } = await radiusClient.get('/permanent-users/view-password.json', {
            params: withDefaults({ user_id: userId }),
        });
        return data;
    }, 'permanent-user-password');
}
async function findVoucher(name) {
    return timedRequest(async () => {
        const filter = JSON.stringify([
            {
                property: 'name',
                operator: 'eq',
                value: name,
            },
        ]);
        const { data } = await radiusClient.get('/vouchers/index.json', {
            params: withDefaults({ limit: 1, page: 1, start: 0, filter }),
        });
        return data;
    }, 'vouchers');
}
//# sourceMappingURL=radiusdeskIntegration.js.map