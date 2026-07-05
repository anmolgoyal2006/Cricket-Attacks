"use strict";
/**
 * Cricket Scoring Feature — Phase 2 + Phase 3
 * Ball controller: record a delivery, undo the last delivery.
 * Wraps multi-document writes in a MongoDB transaction (Atlas replica set).
 *
 * RISK NOTE: If transactions are unavailable (standalone MongoDB), the writes are
 * sequenced Ball → Innings → PlayerMatchStats. A crash between steps will leave
 * partial state. Run in Atlas (replica set) to avoid this.
 *
 * Phase 3 addition: after each successful write, broadcast to /live-match namespace.
 * All socket emits are fire-and-forget AFTER res.json() — they cannot affect HTTP responses.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordBall = recordBall;
exports.undoLastBall = undoLastBall;
const mongoose_1 = __importDefault(require("mongoose"));
const errors_1 = require("../../utils/errors");
// Cricket Scoring Feature — Phase 3: live broadcasting (import after namespace is wired)
const liveMatchSocket_1 = require("../../socket/liveMatchSocket");
const ScoringMatch_1 = __importDefault(require("../../models/cricket-scoring/ScoringMatch"));
const Innings_1 = __importDefault(require("../../models/cricket-scoring/Innings"));
const Ball_1 = __importDefault(require("../../models/cricket-scoring/Ball"));
const scoringLogic_1 = require("../../utils/scoringLogic");
const playerStatsService_1 = require("../../services/playerStatsService");
const matchCompletionService_1 = require("../../services/matchCompletionService");
// ── Helper: resolve "guest:Name" or real ObjectId string ─────────────────────
// The client sends "guest:<displayName>" for players without accounts.
// Returns the correct DB fields and the PlayerKey for stats upserts.
const GUEST_PREFIX = 'guest:';
function resolvePlayer(raw) {
    if (!raw)
        return { id: null, guestName: null, statsKey: '' };
    if (raw.startsWith(GUEST_PREFIX)) {
        const name = raw.slice(GUEST_PREFIX.length);
        return { id: null, guestName: name, statsKey: { guestName: name } };
    }
    return { id: new mongoose_1.default.Types.ObjectId(raw), guestName: null, statsKey: raw };
}
// ── POST /api/scoring/matches/:matchId/balls ──────────────────────────────────
async function recordBall(req, res, next) {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { matchId } = req.params;
        const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;
        const { runsScored = 0, extraType = null, extraRuns = 0, isWicket = false, wicketType = null, dismissedPlayerId = null, fielderId = null, bowlerId, batsmanOnStrikeId, nonStrikerId, } = req.body;
        if (!bowlerId || !batsmanOnStrikeId || !nonStrikerId) {
            throw new errors_1.BadRequestError('bowlerId, batsmanOnStrikeId, nonStrikerId are required');
        }
        // Resolve player ids — support both real ObjectIds and "guest:<name>" tokens
        const bowler = resolvePlayer(bowlerId);
        const batsman = resolvePlayer(batsmanOnStrikeId);
        const nonStrk = resolvePlayer(nonStrikerId);
        const dismissed = resolvePlayer(dismissedPlayerId);
        const fielder = resolvePlayer(fielderId);
        const match = await ScoringMatch_1.default.findById(matchIdStr).session(session);
        if (!match)
            throw new errors_1.NotFoundError('Match');
        if (match.status !== 'live')
            throw new errors_1.BadRequestError('Match is not live');
        const innings = await Innings_1.default.findOne({
            matchId: matchIdStr,
            inningsNumber: match.currentInnings,
            isCompleted: false,
        }).session(session);
        if (!innings)
            throw new errors_1.NotFoundError('Active innings');
        // ── Over / ball position ──────────────────────────────────────────────────
        const legal = (0, scoringLogic_1.isLegalDelivery)(extraType);
        const { over, ballsInCurrentOver, oversCompleted, isEndOfOver } = (0, scoringLogic_1.calculateOverBall)(innings.oversCompleted, innings.ballsInCurrentOver, legal);
        // Legal ball number within the over (for storage)
        const ballNumber = legal ? innings.ballsInCurrentOver + 1 : innings.ballsInCurrentOver;
        // ── Extras breakdown ──────────────────────────────────────────────────────
        const extrasBreakdown = (0, scoringLogic_1.calculateExtrasBreakdown)(extraType, extraRuns);
        const deliveryRuns = (0, scoringLogic_1.totalDeliveryRuns)(runsScored, extraRuns);
        // ── Save ball ─────────────────────────────────────────────────────────────
        const [ball] = await Ball_1.default.create([
            {
                matchId: matchIdStr,
                inningsId: innings._id,
                over: innings.oversCompleted,
                ballNumber,
                bowlerId: bowler.id,
                batsmanOnStrikeId: batsman.id,
                nonStrikerId: nonStrk.id,
                guestBowler: bowler.guestName,
                guestBatsman: batsman.guestName,
                guestNonStriker: nonStrk.guestName,
                runsScored,
                extraType: extraType || null,
                extraRuns,
                isWicket,
                wicketType: isWicket ? wicketType : null,
                dismissedPlayerId: isWicket ? dismissed.id : null,
                guestDismissed: isWicket ? dismissed.guestName : null,
                fielderId: fielder.id,
                guestFielder: fielder.guestName,
                isLegalDelivery: legal,
                timestamp: new Date(),
            },
        ], { session });
        // ── Update innings totals ─────────────────────────────────────────────────
        innings.totalRuns += deliveryRuns;
        innings.extras.wides += extrasBreakdown.wides;
        innings.extras.noBalls += extrasBreakdown.noBalls;
        innings.extras.byes += extrasBreakdown.byes;
        innings.extras.legByes += extrasBreakdown.legByes;
        if (isWicket)
            innings.totalWickets += 1;
        if (legal) {
            if (isEndOfOver) {
                innings.oversCompleted += 1;
                innings.ballsInCurrentOver = 0;
            }
            else {
                innings.ballsInCurrentOver += 1;
            }
        }
        await innings.save({ session });
        // ── Strike rotation ───────────────────────────────────────────────────────
        const rotate = (0, scoringLogic_1.shouldRotateStrike)(runsScored, legal, isEndOfOver);
        // End-of-over always swaps; mid-over swap only on odd runs
        const strikeSwapped = isEndOfOver || rotate;
        // ── Player stats ──────────────────────────────────────────────────────────
        // Batsman on strike faces the ball
        await (0, playerStatsService_1.incrementBattingStats)(matchIdStr, batsman.statsKey, {
            runs: runsScored,
            ballFaced: legal ? 1 : 0,
            isBoundaryFour: runsScored === 4,
            isBoundarySix: runsScored === 6,
            isOut: isWicket && batsmanOnStrikeId === (dismissedPlayerId ?? batsmanOnStrikeId),
            dismissalType: isWicket && batsmanOnStrikeId === (dismissedPlayerId ?? batsmanOnStrikeId) ? wicketType : null,
        }, session);
        // Runs chargeable to bowler: bat runs + no-ball penalty; wides + byes + leg-byes also count
        const runsChargedToBowler = runsScored + extrasBreakdown.wides + extrasBreakdown.noBalls + extrasBreakdown.byes + extrasBreakdown.legByes;
        await (0, playerStatsService_1.incrementBowlingStats)(matchIdStr, bowler.statsKey, {
            ballBowled: legal ? 1 : 0,
            runsConceded: runsChargedToBowler,
            isWicket: isWicket && !['runout'].includes(wicketType || ''),
        }, session);
        // ── Check innings / match completion ──────────────────────────────────────
        // Also check target mid-over for 2nd innings
        const targetChased = innings.inningsNumber === 2 &&
            innings.target != null &&
            innings.totalRuns >= innings.target;
        let completionResult = {
            inningsComplete: false,
            matchComplete: false,
            resultText: undefined,
        };
        if (targetChased || innings.totalWickets >= Math.max(0, (innings.battingTeam === 'teamA' ? match.teamA.players.length : match.teamB.players.length) - 1) || innings.oversCompleted >= match.oversFormat) {
            completionResult = await (0, matchCompletionService_1.checkAndHandleCompletion)(innings, match, session);
        }
        await session.commitTransaction();
        session.endSession();
        const needsNewBatsman = isWicket && !completionResult.inningsComplete && !completionResult.matchComplete;
        res.status(201).json({
            ball,
            innings: {
                totalRuns: innings.totalRuns,
                totalWickets: innings.totalWickets,
                oversCompleted: innings.oversCompleted,
                ballsInCurrentOver: innings.ballsInCurrentOver,
                extras: innings.extras,
            },
            flags: {
                strikeSwapped,
                isEndOfOver,
                needsNewBatsman,
                inningsComplete: completionResult.inningsComplete,
                matchComplete: completionResult.matchComplete,
                resultText: completionResult.resultText || null,
            },
        });
        // ── Phase 3: broadcast to /live-match namespace ───────────────────────────
        // All emits are fire-and-forget after the HTTP response is sent.
        // They cannot throw or affect the response above.
        try {
            const room = `match_${matchIdStr}`;
            const inningsSnapshot = {
                totalRuns: innings.totalRuns,
                totalWickets: innings.totalWickets,
                oversCompleted: innings.oversCompleted,
                ballsInCurrentOver: innings.ballsInCurrentOver,
                extras: innings.extras,
            };
            const eventFlags = {
                strikeSwapped,
                isEndOfOver,
                needsNewBatsman,
                inningsComplete: completionResult.inningsComplete,
                matchComplete: completionResult.matchComplete,
                resultText: completionResult.resultText || null,
            };
            // Core ball event — all connected spectators update their scorecard
            liveMatchSocket_1.liveMatchNamespace.to(room).emit('ball:recorded', {
                ball,
                innings: inningsSnapshot,
                flags: eventFlags,
            });
            // Dismissal event — UI can trigger a dedicated toast / animation
            if (isWicket) {
                liveMatchSocket_1.liveMatchNamespace.to(room).emit('wicket:fallen', {
                    ball,
                    dismissedPlayerId,
                    wicketType,
                    fielderId,
                    innings: inningsSnapshot,
                });
            }
            // Innings-complete event — UI shows innings break screen + target
            if (completionResult.inningsComplete && !completionResult.matchComplete) {
                liveMatchSocket_1.liveMatchNamespace.to(room).emit('innings:completed', {
                    completedInningsNumber: match.currentInnings,
                    innings: inningsSnapshot,
                    target: innings.inningsNumber === 1 ? innings.totalRuns + 1 : null,
                    resultText: completionResult.resultText || null,
                });
            }
            // Match-complete event — UI shows final result screen
            if (completionResult.matchComplete) {
                liveMatchSocket_1.liveMatchNamespace.to(room).emit('match:completed', {
                    resultText: completionResult.resultText || null,
                    innings: inningsSnapshot,
                });
            }
        }
        catch (emitErr) {
            // Never let a socket emit error bubble up and affect the HTTP layer
            console.error('[live-match] emit error in recordBall:', emitErr);
        }
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
    }
}
// ── DELETE /api/scoring/matches/:matchId/balls/last ───────────────────────────
async function undoLastBall(req, res, next) {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { matchId } = req.params;
        const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;
        const match = await ScoringMatch_1.default.findById(matchIdStr).session(session);
        if (!match)
            throw new errors_1.NotFoundError('Match');
        if (match.status !== 'live')
            throw new errors_1.BadRequestError('Match is not live — cannot undo');
        const innings = await Innings_1.default.findOne({
            matchId: matchIdStr,
            inningsNumber: match.currentInnings,
        }).session(session);
        if (!innings)
            throw new errors_1.NotFoundError('Current innings');
        // Find the most recent ball for this innings
        const lastBall = await Ball_1.default.findOne({ inningsId: innings._id })
            .sort({ _id: -1 })
            .session(session);
        if (!lastBall)
            throw new errors_1.BadRequestError('No balls recorded in this innings yet');
        // ── Reverse innings totals ────────────────────────────────────────────────
        const deliveryRuns = (0, scoringLogic_1.totalDeliveryRuns)(lastBall.runsScored, lastBall.extraRuns);
        const extrasBreakdown = (0, scoringLogic_1.calculateExtrasBreakdown)(lastBall.extraType, lastBall.extraRuns);
        innings.totalRuns = Math.max(0, innings.totalRuns - deliveryRuns);
        innings.extras.wides = Math.max(0, innings.extras.wides - extrasBreakdown.wides);
        innings.extras.noBalls = Math.max(0, innings.extras.noBalls - extrasBreakdown.noBalls);
        innings.extras.byes = Math.max(0, innings.extras.byes - extrasBreakdown.byes);
        innings.extras.legByes = Math.max(0, innings.extras.legByes - extrasBreakdown.legByes);
        if (lastBall.isWicket)
            innings.totalWickets = Math.max(0, innings.totalWickets - 1);
        if (lastBall.isLegalDelivery) {
            // Were we at the start of a fresh over?
            if (innings.ballsInCurrentOver === 0 && innings.oversCompleted > 0) {
                innings.oversCompleted -= 1;
                innings.ballsInCurrentOver = 5; // rewind to 5 balls in previous over
            }
            else {
                innings.ballsInCurrentOver = Math.max(0, innings.ballsInCurrentOver - 1);
            }
        }
        await innings.save({ session });
        // ── Reverse player stats ──────────────────────────────────────────────────
        // Reconstruct stats keys from the saved ball (handles both ObjectId and guest fields)
        const undoBatsmanKey = lastBall.batsmanOnStrikeId
            ? lastBall.batsmanOnStrikeId.toString()
            : { guestName: lastBall.guestBatsman ?? '' };
        const undoBowlerKey = lastBall.bowlerId
            ? lastBall.bowlerId.toString()
            : { guestName: lastBall.guestBowler ?? '' };
        await (0, playerStatsService_1.decrementBattingStats)(matchIdStr, undoBatsmanKey, {
            runs: lastBall.runsScored,
            ballFaced: lastBall.isLegalDelivery ? 1 : 0,
            isBoundaryFour: lastBall.runsScored === 4,
            isBoundarySix: lastBall.runsScored === 6,
            isOut: lastBall.isWicket &&
                (lastBall.dismissedPlayerId?.toString() === lastBall.batsmanOnStrikeId?.toString() ||
                    (lastBall.guestDismissed != null && lastBall.guestDismissed === lastBall.guestBatsman)),
            dismissalType: lastBall.wicketType,
        }, session);
        const runsChargedToBowler = lastBall.runsScored +
            extrasBreakdown.wides +
            extrasBreakdown.noBalls +
            extrasBreakdown.byes +
            extrasBreakdown.legByes;
        await (0, playerStatsService_1.decrementBowlingStats)(matchIdStr, undoBowlerKey, {
            ballBowled: lastBall.isLegalDelivery ? 1 : 0,
            runsConceded: runsChargedToBowler,
            isWicket: lastBall.isWicket && !['runout'].includes(lastBall.wicketType || ''),
        }, session);
        // ── Delete the ball ───────────────────────────────────────────────────────
        await Ball_1.default.deleteOne({ _id: lastBall._id }, { session });
        await session.commitTransaction();
        session.endSession();
        res.json({
            undone: lastBall,
            innings: {
                totalRuns: innings.totalRuns,
                totalWickets: innings.totalWickets,
                oversCompleted: innings.oversCompleted,
                ballsInCurrentOver: innings.ballsInCurrentOver,
                extras: innings.extras,
            },
        });
        // ── Phase 3: broadcast undo to /live-match namespace ─────────────────────
        try {
            liveMatchSocket_1.liveMatchNamespace.to(`match_${matchIdStr}`).emit('ball:undone', {
                undone: lastBall,
                innings: {
                    totalRuns: innings.totalRuns,
                    totalWickets: innings.totalWickets,
                    oversCompleted: innings.oversCompleted,
                    ballsInCurrentOver: innings.ballsInCurrentOver,
                    extras: innings.extras,
                },
            });
        }
        catch (emitErr) {
            console.error('[live-match] emit error in undoLastBall:', emitErr);
        }
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
    }
}
//# sourceMappingURL=ballController.js.map