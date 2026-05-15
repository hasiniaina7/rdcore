"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)('Swagger docs routes', () => {
    (0, vitest_1.it)('returns HTML for the Swagger UI', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/docs/');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.headers['content-type']).toContain('text/html');
        (0, vitest_1.expect)(res.text).toContain('<title>Swagger UI</title>');
    });
    (0, vitest_1.it)('returns the OpenAPI YAML file', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/docs/openapi.yaml');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.headers['content-type']).toContain('yaml');
        (0, vitest_1.expect)(res.text).toContain('openapi:');
    });
});
//# sourceMappingURL=docs.test.js.map