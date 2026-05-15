"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAuth = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const adminAuthService_1 = require("../services/adminAuthService");
const requireAdminAuth = (req, _res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
        return next((0, http_errors_1.default)(401, 'Admin token required'));
    }
    const token = authorization.slice(7);
    const session = (0, adminAuthService_1.verifyAdminToken)(token);
    if (!session) {
        return next((0, http_errors_1.default)(401, 'Invalid or expired admin token'));
    }
    req.adminSession = { username: session.username, mode: session.mode };
    req.adminTokenValue = token;
    return next();
};
exports.requireAdminAuth = requireAdminAuth;
//# sourceMappingURL=adminAuth.js.map