"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const envCandidates = [
    path_1.default.resolve(__dirname, '../../.env'),
    path_1.default.resolve(__dirname, '../../../.env'),
    path_1.default.resolve(__dirname, '../.env'),
];
for (const candidate of envCandidates) {
    if (fs_1.default.existsSync(candidate)) {
        dotenv_1.default.config({ path: candidate, override: false });
    }
}
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    RADIUS_BASE_URL: zod_1.z.string().url(),
    RADIUS_TOKEN_LOCAL: zod_1.z.string(),
    RADIUS_CLOUD_ID: zod_1.z.string(),
    OMADA_BASE_URL: zod_1.z.string().url(),
    OMADA_OPERATOR: zod_1.z.string(),
    OMADA_PASSWORD: zod_1.z.string(),
    PORTAL_PUBLIC_URL: zod_1.z.string().url(),
    PORTAL_SUCCESS_URL: zod_1.z.string().url(),
    OMADA_EXTERNAL_PORTAL_ENABLED: zod_1.z
        .string()
        .optional()
        .default('true')
        .transform((value) => value === 'true'),
    LOG_LEVEL: zod_1.z.string().default('info'),
    DEFAULT_LANGUAGE: zod_1.z.string().default('fr_FR'),
    ENABLE_SSE_USAGE: zod_1.z
        .string()
        .optional()
        .default('false')
        .transform((value) => value === 'true'),
    ADMIN_AUTH_MODE: zod_1.z.enum(['static', 'radiusmysql']).default('static'),
    ADMIN_STATIC_USER: zod_1.z.string().optional().default('admin'),
    ADMIN_STATIC_PASSWORD: zod_1.z.string().optional().default('change-me'),
    RADIUS_MYSQL_USER: zod_1.z.string().optional().default(''),
    RADIUS_MYSQL_PASSWORD: zod_1.z.string().optional().default(''),
    ADMIN_TOKEN_TTL_MINUTES: zod_1.z.coerce.number().default(240),
    USAGE_SESSION_TTL_MINUTES: zod_1.z.coerce.number().default(30),
    USAGE_SESSION_CACHE_SIZE: zod_1.z.coerce.number().default(1000),
    ALLOW_USAGE_WITHOUT_MAC: zod_1.z
        .string()
        .optional()
        .default('false')
        .transform((value) => value === 'true'),
    CORS_ALLOWED_ORIGINS: zod_1.z
        .string()
        .optional()
        .default([
        'http://localhost:5173',
        'http://localhost:5174',
        'http://192.168.4.244:5173',
        'http://192.168.4.244:5174',
        'https://hotspot.techzone.lat',
    ].join(',')),
    RADIUS_HTTP_TIMEOUT_MS: zod_1.z.coerce.number().default(15000),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
const config = parsed.data;
exports.default = config;
//# sourceMappingURL=config.js.map