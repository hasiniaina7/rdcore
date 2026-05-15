"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const http_errors_1 = __importDefault(require("http-errors"));
const router = (0, express_1.Router)();
router.get('/social/:provider/start', (req, res, next) => {
    try {
        const { provider } = req.params;
        const state = req.query.state || req.requestId;
        res.json({
            success: true,
            data: {
                provider,
                authorizationUrl: `/oauth/${provider}?state=${state}`,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/social/:provider/callback', (req, res, next) => {
    try {
        const { provider } = req.params;
        if (!req.query.state) {
            throw (0, http_errors_1.default)(400, 'state missing');
        }
        res.json({
            success: true,
            data: {
                provider,
                state: req.query.state,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=social.js.map