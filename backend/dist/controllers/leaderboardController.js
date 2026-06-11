"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboardHandler = getLeaderboardHandler;
exports.getMyRankHandler = getMyRankHandler;
const leaderboardService_1 = require("../services/leaderboardService");
async function getLeaderboardHandler(req, res, next) {
    try {
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const leaderboard = await (0, leaderboardService_1.getLeaderboard)(limit);
        res.json({ leaderboard });
    }
    catch (error) {
        next(error);
    }
}
async function getMyRankHandler(req, res, next) {
    try {
        const rank = await (0, leaderboardService_1.getMyRank)(req.userId);
        res.json(rank || { rank: 0, username: '', trophies: 0, battlesWon: 0, battlesPlayed: 0, winRate: 0 });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=leaderboardController.js.map