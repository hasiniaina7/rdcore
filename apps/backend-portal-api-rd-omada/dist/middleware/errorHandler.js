"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const logger_1 = __importDefault(require("../utils/logger"));
// 4 arguments obligatoires pour qu'Express reconnaisse bien le middleware d'erreur.
const errorHandler = (err, req, res, _next) => {
    void _next;
    const status = err.status || err.statusCode || 500;
    const message = typeof err.message === 'string' && err.message.length > 0 ? err.message : 'Internal Server Error';
    const httpErr = (0, http_errors_1.default)(status, message);
    logger_1.default.error({
        err,
        requestId: req.requestId,
        path: req.path,
    });
    res.status(httpErr.status || 500).json({
        success: false,
        message: httpErr.message,
        status: httpErr.status || 500,
        requestId: req.requestId,
    });
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map