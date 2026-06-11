"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const playerRoutes_1 = __importDefault(require("./playerRoutes"));
const collectionRoutes_1 = __importDefault(require("./collectionRoutes"));
const packRoutes_1 = __importDefault(require("./packRoutes"));
const battleRoutes_1 = __importDefault(require("./battleRoutes"));
const leaderboardRoutes_1 = __importDefault(require("./leaderboardRoutes"));
const cricbuzzRoutes_1 = __importDefault(require("./cricbuzzRoutes"));
const rankedRoutes_1 = __importDefault(require("./rankedRoutes"));
const profileRoutes_1 = __importDefault(require("./profileRoutes"));
const historyRoutes_1 = __importDefault(require("./historyRoutes"));
const seasonRoutes_1 = __importDefault(require("./seasonRoutes"));
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_1.default);
router.use('/cards', playerRoutes_1.default);
router.use('/user-cards', collectionRoutes_1.default);
router.use('/packs', packRoutes_1.default);
router.use('/battles', battleRoutes_1.default);
router.use('/leaderboard', leaderboardRoutes_1.default);
router.use('/cricbuzz', cricbuzzRoutes_1.default);
router.use('/ranked', rankedRoutes_1.default);
router.use('/profile', profileRoutes_1.default);
router.use('/history', historyRoutes_1.default);
router.use('/seasons', seasonRoutes_1.default);
// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
//# sourceMappingURL=index.js.map