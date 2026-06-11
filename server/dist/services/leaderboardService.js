"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaderboardForUser = updateLeaderboardForUser;
exports.getLeaderboard = getLeaderboard;
exports.getMyRank = getMyRank;
exports.getLeaderboardAggregated = getLeaderboardAggregated;
exports.getLeaderboardBySeason = getLeaderboardBySeason;
const User_1 = __importDefault(require("../models/User"));
const LeaderboardEntry_1 = __importDefault(require("../models/LeaderboardEntry"));
const AVATARS = ['👑', '🏆', '🥇', '💥', '🌀', '⚡', '🧊', '🎯', '🎳', '⭐'];
async function updateLeaderboardForUser(userId, season = 1) {
    const user = await User_1.default.findById(userId);
    if (!user)
        return;
    const battlesWon = user.wins;
    const battlesPlayed = user.battlesPlayed;
    const winRate = battlesPlayed > 0 ? Math.round((battlesWon / battlesPlayed) * 100) : 0;
    await LeaderboardEntry_1.default.findOneAndUpdate({ user: userId }, {
        user: userId,
        username: user.username,
        eloRating: user.eloRating,
        rankTier: user.rankTier,
        trophies: user.trophies,
        battlesPlayed,
        battlesWon,
        battlesLost: user.losses,
        battlesDrawn: user.draws,
        winRate,
        xp: user.xp,
        streak: user.battleStreak,
        season,
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    }, { upsert: true, new: true });
}
async function getLeaderboard(limit = 50, season) {
    const filter = {};
    if (season !== undefined)
        filter.season = season;
    const entries = await LeaderboardEntry_1.default.find(filter)
        .sort({ eloRating: -1, battlesWon: -1 })
        .limit(limit)
        .lean();
    return entries.map((entry, index) => ({
        rank: index + 1,
        userId: entry.user,
        username: entry.username,
        eloRating: entry.eloRating,
        rankTier: entry.rankTier,
        battlesWon: entry.battlesWon,
        battlesPlayed: entry.battlesPlayed,
        battlesLost: entry.battlesLost || 0,
        battesDrawn: entry.battlesDrawn || 0,
        trophies: entry.trophies || 0,
        winRate: entry.winRate,
        streak: entry.streak || 0,
        avatar: entry.avatar,
        season: entry.season,
        xp: entry.xp,
    }));
}
async function getMyRank(userId, season) {
    const filter = {};
    if (season !== undefined)
        filter.season = season;
    const allEntries = await LeaderboardEntry_1.default.find(filter)
        .sort({ eloRating: -1, battlesWon: -1 })
        .lean();
    const myEntry = allEntries.find((e) => e.user.toString() === userId);
    const rank = allEntries.findIndex((e) => e.user.toString() === userId) + 1;
    if (!myEntry) {
        const user = await User_1.default.findById(userId);
        if (!user)
            return null;
        return {
            rank: allEntries.length + 1,
            userId,
            username: user.username,
            eloRating: user.eloRating,
            rankTier: user.rankTier,
            trophies: user.trophies,
            battlesWon: user.wins,
            battlesPlayed: user.battlesPlayed,
            winRate: user.battlesPlayed > 0 ? Math.round((user.wins / user.battlesPlayed) * 100) : 0,
            streak: user.battleStreak,
        };
    }
    return {
        rank,
        userId: myEntry.user,
        username: myEntry.username,
        eloRating: myEntry.eloRating,
        rankTier: myEntry.rankTier,
        trophies: myEntry.trophies,
        battlesWon: myEntry.battlesWon,
        battlesPlayed: myEntry.battlesPlayed,
        winRate: myEntry.winRate,
        streak: myEntry.streak || 0,
    };
}
async function getLeaderboardAggregated(limit = 50) {
    return LeaderboardEntry_1.default.aggregate([
        { $sort: { eloRating: -1, battlesWon: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userData',
            },
        },
        { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                rank: { $add: [{ $indexOfArray: [{ $map: { input: { $slice: [{ $sortArray: { input: '$eloRating', sortBy: -1 } }, limit] }, as: 'e', in: '$$e._id' } }, '$user'] }, 1] },
                username: 1,
                eloRating: 1,
                rankTier: 1,
                battlesPlayed: 1,
                battlesWon: 1,
                battlesLost: 1,
                winRate: 1,
                streak: 1,
                season: 1,
                avatar: 1,
                createdAt: '$userData.createdAt',
            },
        },
    ]);
}
async function getLeaderboardBySeason(season, limit = 50) {
    return LeaderboardEntry_1.default.find({ season })
        .sort({ eloRating: -1 })
        .limit(limit)
        .lean();
}
//# sourceMappingURL=leaderboardService.js.map