"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const socket_1 = require("./socket");
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
app.use((0, cors_1.default)({
    origin: config_1.config.frontendUrl,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
app.use(rateLimiter_1.generalLimiter);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api', routes_1.default);
app.use(errorHandler_1.errorHandler);
async function start() {
    await (0, database_1.connectDatabase)();
    (0, socket_1.setupSocketServer)(httpServer);
    httpServer.listen(config_1.config.port, () => {
        console.log(`Server running on http://localhost:${config_1.config.port}`);
        console.log(`WebSocket running on ws://localhost:${config_1.config.port}`);
        console.log(`Environment: ${config_1.config.nodeEnv}`);
    });
}
start().catch(console.error);
exports.default = app;
//# sourceMappingURL=server.js.map