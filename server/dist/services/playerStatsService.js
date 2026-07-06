"use strict";
/**
 * Cricket Scoring Feature — Phase 2 + Guest Player extension
 * Increment / decrement PlayerMatchStats for batsmen and bowlers.
 *
 * Uses $inc / $set with upsert:true. This is simpler and more reliable than
 * aggregation pipeline updates, which fail silently when subdoc fields are
 * uninitialized (null fields cause $add to return null instead of the delta).
 *
 * Guest players: pass playerIdOrGuest as { guestName: string }.
 * Registered players: pass ObjectId string or ObjectId.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementBattingStats = incrementBattingStats;
exports.decrementBattingStats = decrementBattingStats;
exports.incrementBowlingStats = incrementBowlingStats;
exports.decrementBowlingStats = decrementBowlingStats;
const mongoose_1 = __importDefault(require("mongoose"));
const PlayerMatchStats_1 = __importDefault(require("../models/cricket-scoring/PlayerMatchStats"));
function isGuestKey(player) {
    return (typeof player === 'object' &&
        !(player instanceof mongoose_1.default.Types.ObjectId) &&
        'guestName' in player);
}
/**
 * Filter for finding the stat document.
 * Guests: match on { matchId, guestName } — no playerId in filter.
 * Registered: match on { matchId, playerId }.
 */
function playerFilter(matchId, inningsNumber, player) {
    if (isGuestKey(player)) {
        return { matchId, inningsNumber, guestName: player.guestName };
    }
    return { matchId, inningsNumber, playerId: player };
}
/**
 * Fields set only on INSERT (not on update).
 * Guests: only guestName — playerId field stays fully absent.
 * Registered: only playerId — guestName field stays fully absent.
 * Both: initialize all numeric stat sub-fields to 0 so $inc always works.
 */
function setOnInsertFields(player, inningsNumber) {
    const statsDefaults = {
        'battingStats.runs': 0,
        'battingStats.ballsFaced': 0,
        'battingStats.fours': 0,
        'battingStats.sixes': 0,
        'battingStats.isOut': false,
        'battingStats.dismissalType': null,
        'battingStats.strikeRate': 0,
        'bowlingStats.ballsBowled': 0,
        'bowlingStats.runsConceded': 0,
        'bowlingStats.wickets': 0,
        'bowlingStats.maidens': 0,
        'bowlingStats.oversBowled': 0,
        'bowlingStats.economy': 0,
        'fieldingStats.catches': 0,
        'fieldingStats.runOuts': 0,
        'fieldingStats.stumpings': 0,
    };
    if (isGuestKey(player)) {
        return { guestName: player.guestName, inningsNumber, ...statsDefaults };
    }
    return { playerId: player, inningsNumber, ...statsDefaults };
}
async function incrementBattingStats(matchId, inningsNumber, player, delta, session) {
    if (!player || (typeof player === 'string' && !player))
        return;
    const filter = playerFilter(matchId, inningsNumber, player);
    // Step 1: ensure doc exists with all fields initialized
    await PlayerMatchStats_1.default.findOneAndUpdate(filter, { $setOnInsert: setOnInsertFields(player, inningsNumber) }, { upsert: true, new: false, session, setDefaultsOnInsert: false });
    // Step 2: increment with plain $inc / $set — always safe since fields are initialized
    const incUpdate = {
        'battingStats.runs': delta.runs,
        'battingStats.ballsFaced': delta.ballFaced,
        'battingStats.fours': delta.isBoundaryFour ? 1 : 0,
        'battingStats.sixes': delta.isBoundarySix ? 1 : 0,
    };
    // Remove zero-value increments to keep the update clean
    const cleanInc = Object.fromEntries(Object.entries(incUpdate).filter(([, v]) => v !== 0));
    const setUpdate = {};
    if (delta.isOut) {
        setUpdate['battingStats.isOut'] = true;
        setUpdate['battingStats.dismissalType'] = delta.dismissalType || null;
    }
    const update = {};
    if (Object.keys(cleanInc).length > 0)
        update.$inc = cleanInc;
    if (Object.keys(setUpdate).length > 0)
        update.$set = setUpdate;
    if (Object.keys(update).length > 0) {
        await PlayerMatchStats_1.default.findOneAndUpdate(filter, update, { session });
    }
    // Recalculate strikeRate after the inc
    await recalcBattingDerived(filter, session);
}
async function decrementBattingStats(matchId, inningsNumber, player, delta, session) {
    if (!player || (typeof player === 'string' && !player))
        return;
    const filter = playerFilter(matchId, inningsNumber, player);
    // Clamp at 0 via pipeline (only place we need pipeline — for the $max clamping)
    await PlayerMatchStats_1.default.findOneAndUpdate(filter, [
        {
            $set: {
                'battingStats.runs': { $max: [0, { $subtract: [{ $ifNull: ['$battingStats.runs', 0] }, delta.runs] }] },
                'battingStats.ballsFaced': { $max: [0, { $subtract: [{ $ifNull: ['$battingStats.ballsFaced', 0] }, delta.ballFaced] }] },
                'battingStats.fours': { $max: [0, { $subtract: [{ $ifNull: ['$battingStats.fours', 0] }, delta.isBoundaryFour ? 1 : 0] }] },
                'battingStats.sixes': { $max: [0, { $subtract: [{ $ifNull: ['$battingStats.sixes', 0] }, delta.isBoundarySix ? 1 : 0] }] },
                ...(delta.isOut ? { 'battingStats.isOut': false, 'battingStats.dismissalType': null } : {}),
            },
        },
        {
            $set: {
                'battingStats.strikeRate': {
                    $cond: [
                        { $gt: [{ $ifNull: ['$battingStats.ballsFaced', 0] }, 0] },
                        { $multiply: [{ $divide: ['$battingStats.runs', '$battingStats.ballsFaced'] }, 100] },
                        0,
                    ],
                },
            },
        },
    ], { session });
}
async function incrementBowlingStats(matchId, inningsNumber, player, delta, session) {
    if (!player || (typeof player === 'string' && !player))
        return;
    const filter = playerFilter(matchId, inningsNumber, player);
    // Ensure doc exists
    await PlayerMatchStats_1.default.findOneAndUpdate(filter, { $setOnInsert: setOnInsertFields(player, inningsNumber) }, { upsert: true, new: false, session, setDefaultsOnInsert: false });
    const incUpdate = {
        'bowlingStats.ballsBowled': delta.ballBowled,
        'bowlingStats.runsConceded': delta.runsConceded,
        'bowlingStats.wickets': delta.isWicket ? 1 : 0,
        'bowlingStats.maidens': delta.isMaiden ? 1 : 0,
    };
    const cleanInc = Object.fromEntries(Object.entries(incUpdate).filter(([, v]) => v !== 0));
    if (Object.keys(cleanInc).length > 0) {
        await PlayerMatchStats_1.default.findOneAndUpdate(filter, { $inc: cleanInc }, { session });
    }
    await recalcBowlingDerived(filter, session);
}
async function decrementBowlingStats(matchId, inningsNumber, player, delta, session) {
    if (!player || (typeof player === 'string' && !player))
        return;
    const filter = playerFilter(matchId, inningsNumber, player);
    await PlayerMatchStats_1.default.findOneAndUpdate(filter, [
        {
            $set: {
                'bowlingStats.ballsBowled': { $max: [0, { $subtract: [{ $ifNull: ['$bowlingStats.ballsBowled', 0] }, delta.ballBowled] }] },
                'bowlingStats.runsConceded': { $max: [0, { $subtract: [{ $ifNull: ['$bowlingStats.runsConceded', 0] }, delta.runsConceded] }] },
                'bowlingStats.wickets': { $max: [0, { $subtract: [{ $ifNull: ['$bowlingStats.wickets', 0] }, delta.isWicket ? 1 : 0] }] },
                'bowlingStats.maidens': { $max: [0, { $subtract: [{ $ifNull: ['$bowlingStats.maidens', 0] }, delta.isMaiden ? 1 : 0] }] },
            },
        },
        {
            $set: {
                'bowlingStats.oversBowled': { $divide: [{ $ifNull: ['$bowlingStats.ballsBowled', 0] }, 6] },
                'bowlingStats.economy': {
                    $cond: [
                        { $gt: [{ $ifNull: ['$bowlingStats.ballsBowled', 0] }, 0] },
                        { $divide: ['$bowlingStats.runsConceded', { $divide: ['$bowlingStats.ballsBowled', 6] }] },
                        0,
                    ],
                },
            },
        },
    ], { session });
}
// ─── Derived field recalculations ─────────────────────────────────────────────
async function recalcBattingDerived(filter, session) {
    await PlayerMatchStats_1.default.findOneAndUpdate(filter, [
        {
            $set: {
                'battingStats.strikeRate': {
                    $cond: [
                        { $gt: [{ $ifNull: ['$battingStats.ballsFaced', 0] }, 0] },
                        { $multiply: [{ $divide: [{ $ifNull: ['$battingStats.runs', 0] }, { $ifNull: ['$battingStats.ballsFaced', 1] }] }, 100] },
                        0,
                    ],
                },
            },
        },
    ], { session });
}
async function recalcBowlingDerived(filter, session) {
    await PlayerMatchStats_1.default.findOneAndUpdate(filter, [
        {
            $set: {
                'bowlingStats.oversBowled': { $divide: [{ $ifNull: ['$bowlingStats.ballsBowled', 0] }, 6] },
                'bowlingStats.economy': {
                    $cond: [
                        { $gt: [{ $ifNull: ['$bowlingStats.ballsBowled', 0] }, 0] },
                        {
                            $divide: [
                                { $ifNull: ['$bowlingStats.runsConceded', 0] },
                                { $divide: [{ $ifNull: ['$bowlingStats.ballsBowled', 0] }, 6] },
                            ],
                        },
                        0,
                    ],
                },
            },
        },
    ], { session });
}
//# sourceMappingURL=playerStatsService.js.map