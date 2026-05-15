"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const requestContext = (req, _res, next) => {
    if (!req.headers['x-request-id']) {
        req.headers['x-request-id'] = (0, crypto_1.randomUUID)();
    }
    req.requestId = String(req.headers['x-request-id']);
    next();
};
exports.default = requestContext;
//# sourceMappingURL=requestContext.js.map