"use strict";
/**
 * Cricket Scoring Feature — Phase 2
 * Match controller: create, list, detail, add/remove scorers, start match.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatch = createMatch;
exports.listMatches = listMatches;
exports.getMatch = getMatch;
exports.updateScorers = updateScorers;
exports.startMatch = startMatch;
exports.getBalls = getBalls;
exports.getMatchStats = getMatchStats;
const mongoose_1 = __importDefault(require("mongoose"));
const errors_1 = require("../../utils/errors");
const helpers_1 = require("../../utils/helpers");
const ScoringMatch_1 = __importDefault(require("../../models/cricket-scoring/ScoringMatch"));
const Innings_1 = __importDefault(require("../../models/cricket-scoring/Innings"));
// ── POST /api/scoring/matches ─────────────────────────────────────────────────
async function createMatch(req, res, next) {
    try {
        const { teamA, teamB, oversFormat, tossWonBy, tossDecision, venue, scorers } = req.body;
        if (!teamA?.name || !teamA?.players?.length) {
            throw new errors_1.BadRequestError('teamA must have a name and at least one player');
        }
        if (!teamB?.name || !teamB?.players?.length) {
            throw new errors_1.BadRequestError('teamB must have a name and at least one player');
        }
        if (!oversFormat || oversFormat <= 0) {
            throw new errors_1.BadRequestError('oversFormat must be a positive number');
        }
        if (!['teamA', 'teamB'].includes(tossWonBy)) {
            throw new errors_1.BadRequestError('tossWonBy must be "teamA" or "teamB"');
        }
        if (!['bat', 'bowl'].includes(tossDecision)) {
            throw new errors_1.BadRequestError('tossDecision must be "bat" or "bowl"');
        }
        const match = await ScoringMatch_1.default.create({
            teamA,
            teamB,
            oversFormat,
            tossWonBy,
            tossDecision,
            venue: venue || null,
            createdBy: req.userId,
            scorers: scorers || [],
        });
        res.status(201).json({ match });
    }
    catch (err) {
        next(err);
    }
}
// ── GET /api/scoring/matches ──────────────────────────────────────────────────
async function listMatches(req, res, next) {
    try {
        const { page, limit, skip } = (0, helpers_1.parsePagination)(req.query);
        const filter = {};
        if (req.query.status)
            filter.status = req.query.status;
        const [matches, total] = await Promise.all([
            ScoringMatch_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ScoringMatch_1.default.countDocuments(filter),
        ]);
        res.json({ matches, pagination: (0, helpers_1.paginationResponse)(total, page, limit) });
    }
    catch (err) {
        next(err);
    }
}
// ── GET /api/scoring/matches/:id ──────────────────────────────────────────────
async function getMatch(req, res, next) {
    try {
        const match = await ScoringMatch_1.default.findById(req.params.id)
            .populate('teamA.players', 'username')
            .populate('teamB.players', 'username')
            .populate('createdBy', 'username')
            .populate('scorers', 'username')
            .lean();
        if (!match)
            throw new errors_1.NotFoundError('Match');
        // Attach current innings summary
        const currentInnings = await Innings_1.default.findOne({
            matchId: match._id,
            inningsNumber: match.currentInnings,
        }).lean();
        res.json({ match: { ...match, currentInningsSummary: currentInnings || null } });
    }
    catch (err) {
        next(err);
    }
}
// ── PATCH /api/scoring/matches/:id/scorers ────────────────────────────────────
async function updateScorers(req, res, next) {
    try {
        const match = await ScoringMatch_1.default.findById(req.params.id);
        if (!match)
            throw new errors_1.NotFoundError('Match');
        if (match.createdBy.toString() !== req.userId) {
            throw new errors_1.UnauthorizedError('Only the match creator can manage scorers');
        }
        const { add = [], remove = [] } = req.body;
        const addIds = add.map((id) => new mongoose_1.default.Types.ObjectId(id));
        const removeIds = remove.map((id) => id.toString());
        // Remove first, then add (de-dupe via Set)
        const filtered = match.scorers.filter((s) => !removeIds.includes(s.toString()));
        const existing = new Set(filtered.map((s) => s.toString()));
        for (const id of addIds) {
            if (!existing.has(id.toString()))
                filtered.push(id);
        }
        match.scorers = filtered;
        await match.save();
        res.json({ scorers: match.scorers });
    }
    catch (err) {
        next(err);
    }
}
// ── PATCH /api/scoring/matches/:id/start ─────────────────────────────────────
async function startMatch(req, res, next) {
    try {
        const match = await ScoringMatch_1.default.findById(req.params.id);
        if (!match)
            throw new errors_1.NotFoundError('Match');
        if (match.status !== 'upcoming') {
            throw new errors_1.BadRequestError('Match has already started or is completed');
        }
        // Determine which team bats first based on toss
        const battingTeam = match.tossDecision === 'bat'
            ? match.tossWonBy
            : match.tossWonBy === 'teamA'
                ? 'teamB'
                : 'teamA';
        const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';
        // Create first innings
        await Innings_1.default.create({
            matchId: match._id,
            inningsNumber: 1,
            battingTeam,
            bowlingTeam,
        });
        match.status = 'live';
        match.currentInnings = 1;
        await match.save();
        res.json({ match, message: `Match started — ${battingTeam} batting first` });
    }
    catch (err) {
        next(err);
    }
}
// ── GET /api/scoring/matches/:matchId/balls ───────────────────────────────────
// Returns ball-by-ball feed for a match, newest first. Public (authenticated only).
// Phase 5 addition — purely additive, no existing controller code changed.
async function getBalls(req, res, next) {
    try {
        const { matchId } = req.params;
        const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
        const skip = parseInt(req.query.skip || '0', 10);
        const BallModel = (await Promise.resolve().then(() => __importStar(require('../../models/cricket-scoring/Ball')))).default;
        const balls = await BallModel.find({ matchId })
            .sort({ over: -1, ballNumber: -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate('batsmanOnStrikeId', 'username')
            .populate('bowlerId', 'username')
            .populate('dismissedPlayerId', 'username')
            .populate('fielderId', 'username')
            .lean();
        res.json({ balls });
    }
    catch (err) {
        next(err);
    }
}
// ── GET /api/scoring/matches/:matchId/stats ───────────────────────────────────
// Returns per-player batting + bowling stats for a match. Used for scorecards.
// Phase 5 addition — purely additive.
async function getMatchStats(req, res, next) {
    try {
        const { matchId } = req.params;
        const PlayerMatchStats = (await Promise.resolve().then(() => __importStar(require('../../models/cricket-scoring/PlayerMatchStats')))).default;
        const stats = await PlayerMatchStats.find({ matchId })
            .populate('playerId', 'username')
            .lean();
        res.json({ stats });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=matchController.js.map