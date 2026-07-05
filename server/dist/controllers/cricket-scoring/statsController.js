"use strict";
/**
 * Cricket Scoring Feature — Phase 2
 * Stats controller: career stats, match history, scoring leaderboard.
 * Kept separate from the existing card-game leaderboard.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerCareerStats = getPlayerCareerStats;
exports.getPlayerMatchHistory = getPlayerMatchHistory;
exports.getScoringLeaderboard = getScoringLeaderboard;
const errors_1 = require("../../utils/errors");
const helpers_1 = require("../../utils/helpers");
const PlayerCareerStats_1 = __importDefault(require("../../models/cricket-scoring/PlayerCareerStats"));
const PlayerMatchStats_1 = __importDefault(require("../../models/cricket-scoring/PlayerMatchStats"));
const ScoringMatch_1 = __importDefault(require("../../models/cricket-scoring/ScoringMatch"));
// ── GET /api/stats/player/:playerId/career ────────────────────────────────────
async function getPlayerCareerStats(req, res, next) {
    try {
        const { playerId } = req.params;
        const stats = await PlayerCareerStats_1.default.findOne({ playerId })
            .populate('playerId', 'username')
            .lean();
        if (!stats)
            throw new errors_1.NotFoundError('Career stats');
        res.json({ stats });
    }
    catch (err) {
        next(err);
    }
}
// ── GET /api/stats/player/:playerId/matches ───────────────────────────────────
async function getPlayerMatchHistory(req, res, next) {
    try {
        const { playerId } = req.params;
        const { page, limit, skip } = (0, helpers_1.parsePagination)(req.query);
        const [matchStats, total] = await Promise.all([
            PlayerMatchStats_1.default.find({ playerId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                path: 'matchId',
                select: 'teamA teamB status result createdAt oversFormat',
                model: ScoringMatch_1.default,
            })
                .lean(),
            PlayerMatchStats_1.default.countDocuments({ playerId }),
        ]);
        res.json({ matchStats, pagination: (0, helpers_1.paginationResponse)(total, page, limit) });
    }
    catch (err) {
        next(err);
    }
}
// ── GET /api/stats/leaderboard?type=runs|wickets|average ─────────────────────
async function getScoringLeaderboard(req, res, next) {
    try {
        const type = req.query.type || 'runs';
        const validTypes = ['runs', 'wickets', 'average'];
        if (!validTypes.includes(type)) {
            throw new errors_1.BadRequestError(`type must be one of: ${validTypes.join(', ')}`);
        }
        const sortField = {
            runs: 'totalRuns',
            wickets: 'totalWickets',
            average: 'battingAverage',
        };
        const topPlayers = await PlayerCareerStats_1.default.find()
            .sort({ [sortField[type]]: -1 })
            .limit(10)
            .populate('playerId', 'username')
            .lean();
        res.json({ leaderboard: topPlayers, type });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=statsController.js.map