"use strict";
/**
 * Cricket Scoring Feature — Phase 2
 * Middleware: only the match creator or a listed scorer may record/undo balls.
 * Expects req.params.matchId to be set by the router.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isScorerOrCreator = isScorerOrCreator;
const errors_1 = require("../utils/errors");
const ScoringMatch_1 = __importDefault(require("../models/cricket-scoring/ScoringMatch"));
async function isScorerOrCreator(req, _res, next) {
    try {
        const matchId = req.params.matchId || req.params.id;
        // Not .lean() — downstream handlers mutate and .save() this document.
        const match = await ScoringMatch_1.default.findById(matchId);
        if (!match)
            throw new errors_1.NotFoundError('Match');
        const userId = req.userId;
        const isCreator = match.createdBy.toString() === userId;
        const isScorer = match.scorers.some((s) => s.toString() === userId);
        if (!isCreator && !isScorer) {
            throw new errors_1.UnauthorizedError('You are not authorized to score this match');
        }
        req.scoringMatch = match;
        next();
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=isScorerOrCreator.js.map