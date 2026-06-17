"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUsageUser = loginUsageUser;
const usageService_1 = require("./usageService");
const usageSessionStore_1 = require("./usageSessionStore");
async function loginUsageUser(payload) {
    const usage = await (0, usageService_1.fetchUsage)(payload.username, payload.password, payload.mac, 5, false);
    const normalizedMac = payload.mac || usage.mac;
    const { token, expiresAt } = (0, usageSessionStore_1.createUsageSession)({
        username: usage.username,
        password: payload.password,
        mac: normalizedMac,
    });
    return {
        token,
        expiresAt,
        profile: {
            username: usage.username,
            mac: usage.mac ?? normalizedMac,
            accountType: usage.accountType,
        },
    };
}
//# sourceMappingURL=loginService.js.map