"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dynamicService_1 = require("../services/dynamicService");
const router = (0, express_1.Router)();
router.get('/dynamic/details', async (req, res, next) => {
    try {
        const { data, hit } = await (0, dynamicService_1.getDynamicDetail)(req.query);
        res.setHeader('x-cache-status', hit ? 'HIT' : 'MISS');
        res.json({
            success: data.success !== false,
            data: data.data ?? null,
            message: data.message,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=dynamic.js.map