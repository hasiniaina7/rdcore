"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const router = (0, express_1.Router)();
const openapiPath = path_1.default.resolve(process.cwd(), '../../docs/api/openapi.yaml');
if (!fs_1.default.existsSync(openapiPath)) {
    throw new Error(`OpenAPI spec not found at ${openapiPath}`);
}
router.get('/docs/openapi.yaml', (_req, res, next) => {
    try {
        const openapiContent = fs_1.default.readFileSync(openapiPath, 'utf8');
        res.setHeader('Cache-Control', 'no-store');
        res.type('application/yaml').send(openapiContent);
    }
    catch (error) {
        next(error);
    }
});
// Preload and parse the OpenAPI spec to avoid client-side parsing issues
const openapiObject = yaml_1.default.parse(fs_1.default.readFileSync(openapiPath, 'utf8'));
router.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapiObject, { explorer: true }));
exports.default = router;
//# sourceMappingURL=docs.js.map