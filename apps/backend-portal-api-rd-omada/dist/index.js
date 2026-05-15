"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const app_1 = __importDefault(require("./app"));
app_1.default.listen(config_1.default.PORT, () => {
    logger_1.default.info(`Backend listening on ${config_1.default.PORT}`);
});
//# sourceMappingURL=index.js.map