"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeClient = authorizeClient;
exports.readyCheck = readyCheck;
const axios_1 = __importDefault(require("axios"));
const axios_cookiejar_support_1 = require("axios-cookiejar-support");
const tough_cookie_1 = require("tough-cookie");
const config_1 = __importDefault(require("../config"));
const metrics_1 = require("../utils/metrics");
const jar = new tough_cookie_1.CookieJar();
const omadaClient = (0, axios_cookiejar_support_1.wrapper)(axios_1.default.create({
    baseURL: config_1.default.OMADA_BASE_URL,
    timeout: 8000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    jar,
}));
let session = null;
let ongoingLogin = null;
async function login() {
    const end = metrics_1.omadaLatency.startTimer({ endpoint: 'login' });
    try {
        const { data } = await omadaClient.post('/api/v2/hotspot/login', {
            name: config_1.default.OMADA_OPERATOR,
            password: config_1.default.OMADA_PASSWORD,
        });
        const token = data?.result?.token;
        if (!token) {
            throw new Error('Omada token missing');
        }
        session = {
            token,
            expiresAt: Date.now() + 55 * 60 * 1000,
        };
        return session;
    }
    finally {
        end();
        ongoingLogin = null;
    }
}
async function ensureSession() {
    if (session && session.expiresAt > Date.now()) {
        return session;
    }
    if (!ongoingLogin) {
        ongoingLogin = login();
    }
    return ongoingLogin;
}
async function authorizeClient(payload) {
    const sess = await ensureSession();
    const end = metrics_1.omadaLatency.startTimer({ endpoint: 'extPortal/auth' });
    try {
        const { data } = await omadaClient.post('/api/v2/hotspot/extPortal/auth', payload, {
            params: { token: sess.token },
        });
        return data;
    }
    catch (error) {
        if (typeof error === 'object' && error && 'response' in error) {
            const errObj = error;
            if (errObj.response?.status === 401) {
                session = null;
            }
        }
        throw error;
    }
    finally {
        end();
    }
}
async function readyCheck() {
    try {
        await ensureSession();
        return true;
    }
    catch (error) {
        session = null;
        throw error;
    }
}
//# sourceMappingURL=omadaIntegration.js.map