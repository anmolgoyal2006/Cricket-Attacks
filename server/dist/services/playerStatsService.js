"use strict";
/**
 * Cricket Scoring Feature — Phase 2
 * Increment / decrement PlayerMatchStats for batsmen and bowlers.
 * Uses findOneAndUpdate + upsert so it is safe to call without pre-creating the doc.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementBattingStats = incrementBattingStats;
exports.decrementBattingStats = decrementBattingStats;
exports.incrementBowlingStats = incrementBowlingStats;
exports.decrementBowlingStats = decrementBowlingStats;
const PlayerMatchStats_1 = __importDefault(require("../models/cricket-scoring/PlayerMatchStats"));
async function incrementBattingStats(matchId, playerId, delta, session) {
    const inc = {
        'battingStats.runs': delta.runs,
        'battingStats.ballsFaced': delta.ballFaced,
        'battingStats.fours': delta.isBoundaryFour ? 1 : 0,
        'battingStats.sixes': delta.isBoundarySix ? 1 : 0,
    };
    const set = {};
    if (delta.isOut) {
        set['battingStats.isOut'] = true;
        set['battingStats.dismissalType'] = delta.dismissalType || null;
    }
    const doc = await PlayerMatchStats_1.default.findOneAndUpdate({ matchId, playerId }, [
        {
            $set: {
                'battingStats.runs': { $add: ['$battingStats.runs', delta.runs] },
                'battingStats.ballsFaced': { $add: ['$battingStats.ballsFaced', delta.ballFaced] },
                'battingStats.fours': { $add: ['$battingStats.fours', delta.isBoundaryFour ? 1 : 0] },
                'battingStats.sixes': { $add: ['$battingStats.sixes', delta.isBoundarySix ? 1 : 0] },
                ...(delta.isOut ? {
                    'battingStats.isOut': true,
                    'battingStats.dismissalType': delta.dismissalType || null,
                } : {}),
            },
        },
        {
            $set: {
                'battingStats.strikeRate': {
                    $cond: [
                        { $gt: ['$battingStats.ballsFaced', 0] },
                        { $multiply: [{ $divide: ['$battingStats.runs', '$battingStats.ballsFaced'] }, 100] },
                        0,
                    ],
                },
            },
        },
    ], { upsert: true, new: true, session });
}
async function decrementBattingStats(matchId, playerId, delta, session) {
    await PlayerMatchStats_1.default.findOneAndUpdate({ matchId, playerId }, [
        {
            $set: {
                'battingStats.runs': { $max: [0, { $subtract: ['$battingStats.runs', delta.runs] }] },
                'battingStats.ballsFaced': { $max: [0, { $subtract: ['$battingStats.ballsFaced', delta.ballFaced] }] },
                'battingStats.fours': { $max: [0, { $subtract: ['$battingStats.fours', delta.isBoundaryFour ? 1 : 0] }] },
                'battingStats.sixes': { $max: [0, { $subtract: ['$battingStats.sixes', delta.isBoundarySix ? 1 : 0] }] },
                ...(delta.isOut ? { 'battingStats.isOut': false, 'battingStats.dismissalType': null } : {}),
            },
        },
        {
            $set: {
                'battingStats.strikeRate': {
                    $cond: [
                        { $gt: ['$battingStats.ballsFaced', 0] },
                        { $multiply: [{ $divide: ['$battingStats.runs', '$battingStats.ballsFaced'] }, 100] },
                        0,
                    ],
                },
            },
        },
    ], { session });
}
async function incrementBowlingStats(matchId, playerId, delta, session) {
    await PlayerMatchStats_1.default.findOneAndUpdate({ matchId, playerId }, [
        {
            $set: {
                'bowlingStats.ballsBowled': { $add: ['$bowlingStats.ballsBowled', delta.ballBowled] },
                'bowlingStats.runsConceded': { $add: ['$bowlingStats.runsConceded', delta.runsConceded] },
                'bowlingStats.wickets': { $add: ['$bowlingStats.wickets', delta.isWicket ? 1 : 0] },
                'bowlingStats.maidens': { $add: ['$bowlingStats.maidens', delta.isMaiden ? 1 : 0] },
            },
        },
        {
            $set: {
                'bowlingStats.oversBowled': { $divide: ['$bowlingStats.ballsBowled', 6] },
                'bowlingStats.economy': {
                    $cond: [
                        { $gt: ['$bowlingStats.ballsBowled', 0] },
                        {
                            $divide: [
                                '$bowlingStats.runsConceded',
                                { $divide: ['$bowlingStats.ballsBowled', 6] },
                            ],
                        },
                        0,
                    ],
                },
            },
        },
    ], { upsert: true, new: true, session });
}
async function decrementBowlingStats(matchId, playerId, delta, session) {
    await PlayerMatchStats_1.default.findOneAndUpdate({ matchId, playerId }, [
        {
            $set: {
                'bowlingStats.ballsBowled': { $max: [0, { $subtract: ['$bowlingStats.ballsBowled', delta.ballBowled] }] },
                'bowlingStats.runsConceded': { $max: [0, { $subtract: ['$bowlingStats.runsConceded', delta.runsConceded] }] },
                'bowlingStats.wickets': { $max: [0, { $subtract: ['$bowlingStats.wickets', delta.isWicket ? 1 : 0] }] },
                'bowlingStats.maidens': { $max: [0, { $subtract: ['$bowlingStats.maidens', delta.isMaiden ? 1 : 0] }] },
            },
        },
        {
            $set: {
                'bowlingStats.oversBowled': { $divide: ['$bowlingStats.ballsBowled', 6] },
                'bowlingStats.economy': {
                    $cond: [
                        { $gt: ['$bowlingStats.ballsBowled', 0] },
                        { $divide: ['$bowlingStats.runsConceded', { $divide: ['$bowlingStats.ballsBowled', 6] }] },
                        0,
                    ],
                },
            },
        },
    ], { session });
}
//# sourceMappingURL=playerStatsService.js.map