"use strict";
/**
 * Cricket Scoring Feature — Phase 2 + Guest Player extension
 * Folds per-match PlayerMatchStats into lifetime PlayerCareerStats.
 * Called once when a match completes. Idempotent via the statsProcessed flag.
 *
 * Guest players (playerId=null, guestName set) are skipped during the fold —
 * their stats stay in PlayerMatchStats. When the guest later registers with a
 * matching username, call linkGuestStatsToUser() to retroactively attach all
 * their historical match stats to the new account.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.foldMatchStatsIntoCareer = foldMatchStatsIntoCareer;
exports.linkGuestStatsToUser = linkGuestStatsToUser;
const ScoringMatch_1 = __importDefault(require("../models/cricket-scoring/ScoringMatch"));
const PlayerMatchStats_1 = __importDefault(require("../models/cricket-scoring/PlayerMatchStats"));
const PlayerCareerStats_1 = __importDefault(require("../models/cricket-scoring/PlayerCareerStats"));
async function foldMatchStatsIntoCareer(matchId) {
    // Idempotency guard — skip if already processed
    const match = await ScoringMatch_1.default.findById(matchId);
    if (!match)
        return;
    if (match.statsProcessed)
        return;
    const allMatchStats = await PlayerMatchStats_1.default.find({ matchId });
    if (allMatchStats.length === 0) {
        // Nothing to fold — still mark processed to avoid future re-runs
        await ScoringMatch_1.default.findByIdAndUpdate(matchId, { statsProcessed: true });
        return;
    }
    for (const ms of allMatchStats) {
        const playerId = ms.playerId;
        // Skip guest entries — they have no registered account to fold into yet.
        // They will be linked via linkGuestStatsToUser() when the guest registers.
        if (!playerId)
            continue;
        const bat = ms.battingStats;
        const bowl = ms.bowlingStats;
        const field = ms.fieldingStats;
        // Fetch current career stats to check highestScore / bestBowling comparisons
        const current = await PlayerCareerStats_1.default.findOne({ playerId });
        // Determine if this match batting is a new highest score
        const currentHighest = current?.highestScore ?? 0;
        const newHighest = bat.runs > currentHighest ? bat.runs : currentHighest;
        // Determine if this match bowling figures are a personal best
        // Better = more wickets; if equal wickets, fewer runs conceded
        const curBest = current?.bestBowlingFigures ?? { wickets: 0, runs: 0 };
        const isBetter = bowl.wickets > curBest.wickets ||
            (bowl.wickets === curBest.wickets && bowl.wickets > 0 && bowl.runsConceded < curBest.runs);
        const newBest = isBetter
            ? { wickets: bowl.wickets, runs: bowl.runsConceded }
            : curBest;
        // Projected totals after this match
        const prevRuns = current?.totalRuns ?? 0;
        const prevTimesOut = current?.timesOut ?? 0;
        const prevWickets = current?.totalWickets ?? 0;
        const prevRunsConceded = current?.totalRunsConceded ?? 0;
        const prevBallsFaced = current?.totalBallsFaced ?? 0;
        const prevOversBowled = current?.totalOversBowled ?? 0;
        const newRuns = prevRuns + bat.runs;
        const newTimesOut = prevTimesOut + (bat.isOut ? 1 : 0);
        const newWickets = prevWickets + bowl.wickets;
        const newRunsConceded = prevRunsConceded + bowl.runsConceded;
        const newBallsFaced = prevBallsFaced + bat.ballsFaced;
        const newOversBowled = prevOversBowled + (bowl.ballsBowled / 6);
        // Batting average: if never dismissed, equals total runs
        const battingAverage = newTimesOut > 0 ? newRuns / newTimesOut : newRuns;
        // Batting strike rate
        const battingStrikeRate = newBallsFaced > 0 ? (newRuns / newBallsFaced) * 100 : 0;
        // Bowling average: runs per wicket; use 0 if no wickets to avoid Infinity
        const bowlingAverage = newWickets > 0 ? newRunsConceded / newWickets : 0;
        // Economy: runs per over
        const economyRate = newOversBowled > 0 ? newRunsConceded / newOversBowled : 0;
        await PlayerCareerStats_1.default.findOneAndUpdate({ playerId }, {
            $inc: {
                matchesPlayed: 1,
                totalRuns: bat.runs,
                totalBallsFaced: bat.ballsFaced,
                totalFours: bat.fours,
                totalSixes: bat.sixes,
                timesOut: bat.isOut ? 1 : 0,
                totalWickets: bowl.wickets,
                totalOversBowled: bowl.ballsBowled / 6,
                totalRunsConceded: bowl.runsConceded,
                totalCatches: field.catches,
                totalRunOuts: field.runOuts,
                totalStumpings: field.stumpings,
            },
            $set: {
                highestScore: newHighest,
                bestBowlingFigures: newBest,
                battingAverage: parseFloat(battingAverage.toFixed(2)),
                battingStrikeRate: parseFloat(battingStrikeRate.toFixed(2)),
                bowlingAverage: parseFloat(bowlingAverage.toFixed(2)),
                economyRate: parseFloat(economyRate.toFixed(2)),
                lastUpdated: new Date(),
            },
        }, { upsert: true });
    }
    // Mark match as processed — prevents double-counting
    await ScoringMatch_1.default.findByIdAndUpdate(matchId, { statsProcessed: true });
}
/**
 * linkGuestStatsToUser
 * Called automatically from the auth register flow (or manually) after a new
 * user registers. Finds all PlayerMatchStats rows where guestName matches the
 * new user's username (case-insensitive), sets playerId on each row, then
 * folds those matches into the user's career stats.
 *
 * Also patches the ScoringMatch.teamA/teamB.players array so the player entry
 * gains a userId going forward, keeping the match roster consistent.
 */
async function linkGuestStatsToUser(userId, username) {
    // Find all guest stats rows with this username (case-insensitive)
    const guestStats = await PlayerMatchStats_1.default.find({
        playerId: null,
        guestName: { $regex: new RegExp(`^${username}$`, 'i') },
    });
    if (guestStats.length === 0)
        return { linked: 0 };
    const matchIds = [...new Set(guestStats.map((s) => s.matchId.toString()))];
    // Assign real playerId to each guest stat row
    await PlayerMatchStats_1.default.updateMany({ playerId: null, guestName: { $regex: new RegExp(`^${username}$`, 'i') } }, { $set: { playerId: userId, guestName: null } });
    // Patch ScoringMatch player entries that still have guestName
    await ScoringMatch_1.default.updateMany({
        $or: [
            { 'teamA.players': { $elemMatch: { guestName: { $regex: new RegExp(`^${username}$`, 'i') } } } },
            { 'teamB.players': { $elemMatch: { guestName: { $regex: new RegExp(`^${username}$`, 'i') } } } },
        ],
    }, {
        $set: {
            'teamA.players.$[elem].userId': userId,
            'teamA.players.$[elem].guestName': null,
            'teamB.players.$[elem].userId': userId,
            'teamB.players.$[elem].guestName': null,
        },
    }, {
        arrayFilters: [{ 'elem.guestName': { $regex: new RegExp(`^${username}$`, 'i') } }],
    });
    // Fold each newly-linked match into career stats
    // (skip matches already processed — foldMatchStatsIntoCareer is idempotent only
    //  for the match-level flag; we need per-stat fold here, so call directly)
    for (const matchId of matchIds) {
        await foldSinglePlayerStats(userId, matchId);
    }
    return { linked: guestStats.length };
}
/**
 * Folds a single player's match stats into their career stats.
 * Used by linkGuestStatsToUser to retroactively credit a newly registered user.
 */
async function foldSinglePlayerStats(userId, matchId) {
    const ms = await PlayerMatchStats_1.default.findOne({ matchId, playerId: userId });
    if (!ms)
        return;
    const bat = ms.battingStats;
    const bowl = ms.bowlingStats;
    const field = ms.fieldingStats;
    const current = await PlayerCareerStats_1.default.findOne({ playerId: userId });
    const currentHighest = current?.highestScore ?? 0;
    const newHighest = bat.runs > currentHighest ? bat.runs : currentHighest;
    const curBest = current?.bestBowlingFigures ?? { wickets: 0, runs: 0 };
    const isBetter = bowl.wickets > curBest.wickets ||
        (bowl.wickets === curBest.wickets && bowl.wickets > 0 && bowl.runsConceded < curBest.runs);
    const newBest = isBetter ? { wickets: bowl.wickets, runs: bowl.runsConceded } : curBest;
    const prevRuns = current?.totalRuns ?? 0;
    const prevTimesOut = current?.timesOut ?? 0;
    const prevWickets = current?.totalWickets ?? 0;
    const prevRunsConceded = current?.totalRunsConceded ?? 0;
    const prevBallsFaced = current?.totalBallsFaced ?? 0;
    const prevOversBowled = current?.totalOversBowled ?? 0;
    const newRuns = prevRuns + bat.runs;
    const newTimesOut = prevTimesOut + (bat.isOut ? 1 : 0);
    const newWickets = prevWickets + bowl.wickets;
    const newRunsConceded = prevRunsConceded + bowl.runsConceded;
    const newBallsFaced = prevBallsFaced + bat.ballsFaced;
    const newOversBowled = prevOversBowled + bowl.ballsBowled / 6;
    const battingAverage = newTimesOut > 0 ? newRuns / newTimesOut : newRuns;
    const battingStrikeRate = newBallsFaced > 0 ? (newRuns / newBallsFaced) * 100 : 0;
    const bowlingAverage = newWickets > 0 ? newRunsConceded / newWickets : 0;
    const economyRate = newOversBowled > 0 ? newRunsConceded / newOversBowled : 0;
    await PlayerCareerStats_1.default.findOneAndUpdate({ playerId: userId }, {
        $inc: {
            matchesPlayed: 1,
            totalRuns: bat.runs,
            totalBallsFaced: bat.ballsFaced,
            totalFours: bat.fours,
            totalSixes: bat.sixes,
            timesOut: bat.isOut ? 1 : 0,
            totalWickets: bowl.wickets,
            totalOversBowled: bowl.ballsBowled / 6,
            totalRunsConceded: bowl.runsConceded,
            totalCatches: field.catches,
            totalRunOuts: field.runOuts,
            totalStumpings: field.stumpings,
        },
        $set: {
            highestScore: newHighest,
            bestBowlingFigures: newBest,
            battingAverage: parseFloat(battingAverage.toFixed(2)),
            battingStrikeRate: parseFloat(battingStrikeRate.toFixed(2)),
            bowlingAverage: parseFloat(bowlingAverage.toFixed(2)),
            economyRate: parseFloat(economyRate.toFixed(2)),
            lastUpdated: new Date(),
        },
    }, { upsert: true });
}
//# sourceMappingURL=careerStatsService.js.map