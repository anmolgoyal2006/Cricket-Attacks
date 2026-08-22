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
 * Guests: match on { matchId, inningsNumber, guestName }.
 * Registered: match on { matchId, inningsNumber, playerId }.
 */
function playerFilter(matchId, inningsNumber, player) {
    // Cast explicitly — pipeline updates skip Mongoose casting, and the upsert
    // seeds the new document from these equality predicates.
    const matchObjectId = typeof matchId === 'string' ? new mongoose_1.default.Types.ObjectId(matchId) : matchId;
    if (isGuestKey(player)) {
        return { matchId: matchObjectId, inningsNumber, guestName: player.guestName };
    }
    const playerObjectId = typeof player === 'string' ? new mongoose_1.default.Types.ObjectId(player) : player;
    return { matchId: matchObjectId, inningsNumber, playerId: playerObjectId };
}
/**
 * Pipeline updates have no $setOnInsert, so every field an upsert might create
 * must be defaulted with $ifNull. These seed the stat groups a given update
 * isn't otherwise touching, so the document always has a complete shape.
 * The upsert seeds matchId / inningsNumber / playerId|guestName from the filter,
 * which is what keeps the partial unique indexes intact (no null playerId on
 * guest docs, no null guestName on registered docs).
 */
const SEED_BATTING = {
    'battingStats.runs': { $ifNull: ['$battingStats.runs', 0] },
    'battingStats.ballsFaced': { $ifNull: ['$battingStats.ballsFaced', 0] },
    'battingStats.fours': { $ifNull: ['$battingStats.fours', 0] },
    'battingStats.sixes': { $ifNull: ['$battingStats.sixes', 0] },
    'battingStats.isOut': { $ifNull: ['$battingStats.isOut', false] },
    'battingStats.dismissalType': { $ifNull: ['$battingStats.dismissalType', null] },
    'battingStats.strikeRate': { $ifNull: ['$battingStats.strikeRate', 0] },
};
const SEED_BOWLING = {
    'bowlingStats.ballsBowled': { $ifNull: ['$bowlingStats.ballsBowled', 0] },
    'bowlingStats.runsConceded': { $ifNull: ['$bowlingStats.runsConceded', 0] },
    'bowlingStats.wickets': { $ifNull: ['$bowlingStats.wickets', 0] },
    'bowlingStats.maidens': { $ifNull: ['$bowlingStats.maidens', 0] },
    'bowlingStats.oversBowled': { $ifNull: ['$bowlingStats.oversBowled', 0] },
    'bowlingStats.economy': { $ifNull: ['$bowlingStats.economy', 0] },
};
// careerStatsService reads ms.fieldingStats, so it must always exist.
const SEED_FIELDING = {
    'fieldingStats.catches': { $ifNull: ['$fieldingStats.catches', 0] },
    'fieldingStats.runOuts': { $ifNull: ['$fieldingStats.runOuts', 0] },
    'fieldingStats.stumpings': { $ifNull: ['$fieldingStats.stumpings', 0] },
};
// Mongoose applies updatedAt to pipeline updates but never createdAt.
const SEED_CREATED_AT = { createdAt: { $ifNull: ['$createdAt', '$$NOW'] } };
async function incrementBattingStats(matchId, inningsNumber, player, delta, session) {
    if (!player || (typeof player === 'string' && !player))
        return;
    const filter = playerFilter(matchId, inningsNumber, player);
    // One round trip: upsert, increment, and recompute strikeRate in a single pass.
    await PlayerMatchStats_1.default.findOneAndUpdate(filter, [
        {
            $set: {
                ...SEED_CREATED_AT,
                ...SEED_BOWLING,
                ...SEED_FIELDING,
                'battingStats.runs': { $add: [{ $ifNull: ['$battingStats.runs', 0] }, delta.runs] },
                'battingStats.ballsFaced': { $add: [{ $ifNull: ['$battingStats.ballsFaced', 0] }, delta.ballFaced] },
                'battingStats.fours': { $add: [{ $ifNull: ['$battingStats.fours', 0] }, delta.isBoundaryFour ? 1 : 0] },
                'battingStats.sixes': { $add: [{ $ifNull: ['$battingStats.sixes', 0] }, delta.isBoundarySix ? 1 : 0] },
                'battingStats.isOut': delta.isOut ? true : { $ifNull: ['$battingStats.isOut', false] },
                'battingStats.dismissalType': delta.isOut
                    ? (delta.dismissalType || null)
                    : { $ifNull: ['$battingStats.dismissalType', null] },
            },
        },
        {
            // Second stage so it reads the values the first stage just wrote
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
    ], { upsert: true, session });
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
    // One round trip: upsert, increment, and recompute oversBowled/economy together.
    await PlayerMatchStats_1.default.findOneAndUpdate(filter, [
        {
            $set: {
                ...SEED_CREATED_AT,
                ...SEED_BATTING,
                ...SEED_FIELDING,
                'bowlingStats.ballsBowled': { $add: [{ $ifNull: ['$bowlingStats.ballsBowled', 0] }, delta.ballBowled] },
                'bowlingStats.runsConceded': { $add: [{ $ifNull: ['$bowlingStats.runsConceded', 0] }, delta.runsConceded] },
                'bowlingStats.wickets': { $add: [{ $ifNull: ['$bowlingStats.wickets', 0] }, delta.isWicket ? 1 : 0] },
                'bowlingStats.maidens': { $add: [{ $ifNull: ['$bowlingStats.maidens', 0] }, delta.isMaiden ? 1 : 0] },
            },
        },
        {
            // Second stage so it reads the values the first stage just wrote
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
    ], { upsert: true, session });
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
//# sourceMappingURL=playerStatsService.js.map