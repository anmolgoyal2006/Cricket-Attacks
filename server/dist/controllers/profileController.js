"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.getMyProfile = getMyProfile;
const User_1 = __importDefault(require("../models/User"));
const MatchHistory_1 = __importDefault(require("../models/MatchHistory"));
const Battle_1 = __importDefault(require("../models/Battle"));
const errors_1 = require("../utils/errors");
const eloService_1 = require("../services/eloService");
async function getProfile(req, res, next) {
    try {
        const { id } = req.params;
        const user = await User_1.default.findById(id).lean();
        if (!user)
            throw new errors_1.NotFoundError('User');
        const recentMatches = await MatchHistory_1.default.find({ user: id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        const totalBattles = user.battlesPlayed || 0;
        const winRate = totalBattles > 0 ? Math.round(((user.wins || 0) / totalBattles) * 100) : 0;
        const tierProgress = (0, eloService_1.getNextTierProgress)(user.eloRating || 1000);
        const recentBattles = await Battle_1.default.find({ user: id, status: 'completed' })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('playerSquad', 'name role batting bowling fielding captaincy pressure overall')
            .lean();
        res.json({
            profile: {
                id: user._id,
                username: user.username,
                eloRating: user.eloRating || 1000,
                highestElo: user.highestElo || 1000,
                rankTier: user.rankTier || 'Bronze',
                trophies: user.trophies || 0,
                level: user.level || 1,
                xp: user.xp || 0,
                wins: user.wins || 0,
                losses: user.losses || 0,
                draws: user.draws || 0,
                battlesPlayed: totalBattles,
                winRate,
                battleStreak: user.battleStreak || 0,
                longestStreak: user.longestStreak || 0,
                coins: user.coins || 0,
                createdAt: user.createdAt,
                ...tierProgress,
            },
            recentMatches,
            recentBattles,
        });
    }
    catch (error) {
        next(error);
    }
}
async function getMyProfile(req, res, next) {
    try {
        const user = await User_1.default.findById(req.userId).lean();
        if (!user)
            throw new errors_1.NotFoundError('User');
        const totalBattles = user.battlesPlayed || 0;
        const winRate = totalBattles > 0 ? Math.round(((user.wins || 0) / totalBattles) * 100) : 0;
        const tierProgress = (0, eloService_1.getNextTierProgress)(user.eloRating || 1000);
        res.json({
            profile: {
                id: user._id,
                username: user.username,
                email: user.email,
                eloRating: user.eloRating || 1000,
                highestElo: user.highestElo || 1000,
                rankTier: user.rankTier || 'Bronze',
                trophies: user.trophies || 0,
                level: user.level || 1,
                xp: user.xp || 0,
                coins: user.coins || 0,
                wins: user.wins || 0,
                losses: user.losses || 0,
                draws: user.draws || 0,
                battlesPlayed: totalBattles,
                winRate,
                battleStreak: user.battleStreak || 0,
                longestStreak: user.longestStreak || 0,
                ownedCards: user.ownedCards?.length || 0,
                packsOpened: user.packsOpened || 0,
                createdAt: user.createdAt,
                ...tierProgress,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=profileController.js.map