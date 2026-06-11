"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaderboardForUser = updateLeaderboardForUser;
exports.getLeaderboard = getLeaderboard;
exports.getMyRank = getMyRank;
const User_1 = __importDefault(require("../models/User"));
const LeaderboardEntry_1 = __importDefault(require("../models/LeaderboardEntry"));
const AVATARS = ['👑', '🏆', '🥇', '💥', '🌀', '⚡', '🧊', '🎯', '🎳', '⭐'];
async function updateLeaderboardForUser(userId) {
    const user = await User_1.default.findById(userId);
    if (!user)
        return;
    const battlesWon = user.wins;
    const battlesPlayed = user.battlesPlayed;
    const winRate = battlesPlayed > 0 ? Math.round((battlesWon / battlesPlayed) * 100) : 0;
    await LeaderboardEntry_1.default.findOneAndUpdate({ user: userId }, {
        user: userId,
        username: user.username,
        trophies: user.trophies,
        battlesPlayed,
        battlesWon,
        winRate,
        xp: user.xp,
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    }, { upsert: true, new: true });
}
async function getLeaderboard(limit = 10) {
    const entries = await LeaderboardEntry_1.default.find()
        .sort({ trophies: -1, winRate: -1 })
        .limit(limit)
        .lean();
    return entries.map((entry, index) => ({
        rank: index + 1,
        username: entry.username,
        battlesWon: entry.battlesWon,
        trophies: entry.trophies,
        winRate: entry.winRate,
        avatar: entry.avatar,
    }));
}
async function getMyRank(userId) {
    const allEntries = await LeaderboardEntry_1.default.find()
        .sort({ trophies: -1, winRate: -1 })
        .lean();
    const myEntry = allEntries.find((e) => e.user.toString() === userId);
    const rank = allEntries.findIndex((e) => e.user.toString() === userId) + 1;
    if (!myEntry) {
        const user = await User_1.default.findById(userId);
        if (!user)
            return null;
        return {
            rank: allEntries.length + 1,
            username: user.username,
            trophies: user.trophies,
            battlesWon: user.wins,
            battlesPlayed: user.battlesPlayed,
            winRate: user.battlesPlayed > 0 ? Math.round((user.wins / user.battlesPlayed) * 100) : 0,
        };
    }
    return {
        rank,
        username: myEntry.username,
        trophies: myEntry.trophies,
        battlesWon: myEntry.battlesWon,
        battlesPlayed: myEntry.battlesPlayed,
        winRate: myEntry.winRate,
    };
}
//# sourceMappingURL=leaderboardService.js.map