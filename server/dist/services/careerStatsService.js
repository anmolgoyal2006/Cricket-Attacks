"use strict";
/**
 * Cricket Scoring Feature — Phase 2
 * Folds per-match PlayerMatchStats into lifetime PlayerCareerStats.
 * Called once when a match completes. Idempotent via the statsProcessed flag.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.foldMatchStatsIntoCareer = foldMatchStatsIntoCareer;
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
//# sourceMappingURL=careerStatsService.js.map