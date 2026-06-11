"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboardHandler = getLeaderboardHandler;
exports.getMyRankHandler = getMyRankHandler;
const leaderboardService_1 = require("../services/leaderboardService");
async function getLeaderboardHandler(req, res, next) {
    try {
        const limit = Math.min(100, parseInt(req.query.limit) || 50);
        const season = req.query.season ? parseInt(req.query.season) : undefined;
        let leaderboard;
        if (season !== undefined) {
            leaderboard = await (0, leaderboardService_1.getLeaderboardBySeason)(season, limit);
        }
        else {
            leaderboard = await (0, leaderboardService_1.getLeaderboard)(limit);
        }
        res.json({ leaderboard });
    }
    catch (error) {
        next(error);
    }
}
async function getMyRankHandler(req, res, next) {
    try {
        const season = req.query.season ? parseInt(req.query.season) : undefined;
        const rank = await (0, leaderboardService_1.getMyRank)(req.userId, season);
        res.json(rank || {
            rank: 0, userId: req.userId, username: '', eloRating: 1000,
            rankTier: 'Bronze', trophies: 0, battlesWon: 0, battlesPlayed: 0, winRate: 0, streak: 0,
        });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=leaderboardController.js.map