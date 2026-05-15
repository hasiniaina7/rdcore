"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const pino_http_1 = __importDefault(require("pino-http"));
const requestContext_1 = __importDefault(require("./middleware/requestContext"));
const dynamic_1 = __importDefault(require("./routes/dynamic"));
const connect_1 = __importDefault(require("./routes/connect"));
const usage_1 = __importDefault(require("./routes/usage"));
const auth_1 = __importDefault(require("./routes/auth"));
const social_1 = __importDefault(require("./routes/social"));
const docs_1 = __importDefault(require("./routes/docs"));
const health_1 = __importDefault(require("./routes/health"));
const admin_1 = __importDefault(require("./routes/admin"));
const consumption_1 = __importDefault(require("./routes/consumption"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const config_1 = __importDefault(require("./config"));
const app = (0, express_1.default)();
const allowedOrigins = config_1.default.CORS_ALLOWED_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean);
const allowAllOrigins = allowedOrigins.length === 0 || allowedOrigins.includes('*');
const allowedHeaders = [
    'Content-Type',
    'Authorization',
    'Accept',
    'Cache-Control',
    'Pragma',
    'Expires',
    'If-Modified-Since',
    'If-None-Match',
];
const corsOptions = {
    origin: allowAllOrigins ? true : allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders,
    maxAge: 600,
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(requestContext_1.default);
app.use((0, pino_http_1.default)({
    customProps: (req) => ({ requestId: req.requestId, username: req.body?.username }),
}));
app.use(docs_1.default);
app.use('/api', dynamic_1.default);
app.use('/api', connect_1.default);
app.use('/api', auth_1.default);
app.use('/api', usage_1.default);
app.use('/api', social_1.default);
app.use('/api', admin_1.default);
app.use('/api', consumption_1.default);
app.use('/', health_1.default);
app.use(errorHandler_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map