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
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_1.default);
router.use('/cards', playerRoutes_1.default);
router.use('/user-cards', collectionRoutes_1.default);
router.use('/packs', packRoutes_1.default);
router.use('/battles', battleRoutes_1.default);
router.use('/leaderboard', leaderboardRoutes_1.default);
// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
//# sourceMappingURL=index.js.map