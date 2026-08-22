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
    try {
        const { matchId } = req.params;
        const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;
        const { runsScored = 0, extraType = null, extraRuns = 0, noballExtraKind = null, isWicket = false, wicketType = null, dismissedPlayerId = null, fielderId = null, bowlerId, batsmanOnStrikeId, nonStrikerId, } = req.body;
        if (!bowlerId || !batsmanOnStrikeId || !nonStrikerId) {
            throw new errors_1.BadRequestError('bowlerId, batsmanOnStrikeId, nonStrikerId are required');
        }
        // Resolve player ids — support both real ObjectIds and "guest:<name>" tokens
        const bowler = resolvePlayer(bowlerId);
        const batsman = resolvePlayer(batsmanOnStrikeId);
        const nonStrk = resolvePlayer(nonStrikerId);
        const dismissed = resolvePlayer(dismissedPlayerId);
        const fielder = resolvePlayer(fielderId);
        // Normalise extraType: frontend sends camelCase ('noBall','legBye') but
        // backend ExtraType uses lowercase ('noball','legbye'). Map here once.
        const extraTypeMapped = (() => {
            if (!extraType)
                return null;
            const map = {
                wide: 'wide', Wide: 'wide',
                noBall: 'noball', noball: 'noball', 'no-ball': 'noball', NoBall: 'noball',
                bye: 'bye', Bye: 'bye',
                legBye: 'legbye', legbye: 'legbye', 'leg-bye': 'legbye', LegBye: 'legbye',
            };
            return map[extraType] ?? extraType;
        })();
        // Loaded by the isScorerOrCreator middleware — no second query needed.
        let match = req.scoringMatch;
        if (match.status !== 'live')
            throw new errors_1.BadRequestError('Match is not live');
        const legal = (0, scoringLogic_1.isLegalDelivery)(extraTypeMapped);
        const extrasBreakdown = (0, scoringLogic_1.calculateExtrasBreakdown)(extraTypeMapped, extraRuns, noballExtraKind);
        const deliveryRuns = (0, scoringLogic_1.totalDeliveryRuns)(runsScored, extraRuns, extraTypeMapped);
        // Declared outside the transaction callback because withTransaction may
        // re-run the callback on a transient write conflict.
        let ball;
        let freshInnings;
        let isEndOfOver = false;
        let strikeSwapped = false;
        let attempt = 0;
        let completionResult = {
            inningsComplete: false,
            matchComplete: false,
            resultText: undefined,
        };
        await session.withTransaction(async () => {
            // Reset per-attempt state so a retry never inherits the previous attempt's values
            completionResult = { inningsComplete: false, matchComplete: false, resultText: undefined };
            // checkAndHandleCompletion mutates the in-memory match doc, so on a retry
            // re-read it to discard any mutations from the rolled-back attempt.
            if (attempt++ > 0) {
                const reloaded = await ScoringMatch_1.default.findById(matchIdStr).session(session);
                if (!reloaded)
                    throw new errors_1.NotFoundError('Match');
                match = reloaded;
            }
            // ── Single atomic innings update ────────────────────────────────────────
            // Every mutation is expressed as arithmetic over the stored field, so two
            // concurrent balls can never clobber each other's totals. The over rollover
            // is decided server-side from the on-disk ball count.
            const updated = await Innings_1.default.findOneAndUpdate({
                matchId: new mongoose_1.default.Types.ObjectId(matchIdStr),
                inningsNumber: match.currentInnings,
                isCompleted: false,
            }, [
                {
                    $set: {
                        totalRuns: { $add: [{ $ifNull: ['$totalRuns', 0] }, deliveryRuns] },
                        totalWickets: { $add: [{ $ifNull: ['$totalWickets', 0] }, isWicket ? 1 : 0] },
                        'extras.wides': { $add: [{ $ifNull: ['$extras.wides', 0] }, extrasBreakdown.wides] },
                        'extras.noBalls': { $add: [{ $ifNull: ['$extras.noBalls', 0] }, extrasBreakdown.noBalls] },
                        'extras.byes': { $add: [{ $ifNull: ['$extras.byes', 0] }, extrasBreakdown.byes] },
                        'extras.legByes': { $add: [{ $ifNull: ['$extras.legByes', 0] }, extrasBreakdown.legByes] },
                        // Illegal deliveries leave the over position untouched
                        ...(legal
                            ? {
                                ballsInCurrentOver: {
                                    $cond: [
                                        { $gte: [{ $ifNull: ['$ballsInCurrentOver', 0] }, 5] },
                                        0,
                                        { $add: [{ $ifNull: ['$ballsInCurrentOver', 0] }, 1] },
                                    ],
                                },
                                oversCompleted: {
                                    $cond: [
                                        { $gte: [{ $ifNull: ['$ballsInCurrentOver', 0] }, 5] },
                                        { $add: [{ $ifNull: ['$oversCompleted', 0] }, 1] },
                                        { $ifNull: ['$oversCompleted', 0] },
                                    ],
                                },
                            }
                            : {}),
                    },
                },
            ], { new: true, session });
            if (!updated)
                throw new errors_1.NotFoundError('Active innings');
            freshInnings = updated;
            // ── Recover this ball's position from the post-update state ─────────────
            // The DB already applied the rollover, so invert the known delta.
            let prevOversCompleted;
            let prevBallsInOver;
            if (!legal) {
                prevOversCompleted = freshInnings.oversCompleted;
                prevBallsInOver = freshInnings.ballsInCurrentOver;
            }
            else if (freshInnings.ballsInCurrentOver === 0) {
                prevOversCompleted = freshInnings.oversCompleted - 1;
                prevBallsInOver = 5;
            }
            else {
                prevOversCompleted = freshInnings.oversCompleted;
                prevBallsInOver = freshInnings.ballsInCurrentOver - 1;
            }
            ({ isEndOfOver } = (0, scoringLogic_1.calculateOverBall)(prevOversCompleted, prevBallsInOver, legal));
            // ballNumber for storage: 1-indexed legal ball within the over
            const ballNumber = legal ? prevBallsInOver + 1 : prevBallsInOver;
            // ── Save ball ───────────────────────────────────────────────────────────
            [ball] = await Ball_1.default.create([
                {
                    matchId: matchIdStr,
                    inningsId: freshInnings._id,
                    over: prevOversCompleted,
                    ballNumber,
                    bowlerId: bowler.id,
                    batsmanOnStrikeId: batsman.id,
                    nonStrikerId: nonStrk.id,
                    guestBowler: bowler.guestName,
                    guestBatsman: batsman.guestName,
                    guestNonStriker: nonStrk.guestName,
                    runsScored,
                    extraType: extraTypeMapped || null,
                    extraRuns,
                    noballExtraKind: extraTypeMapped === 'noball' ? (noballExtraKind || 'overthrow') : null,
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
            // ── Strike rotation ─────────────────────────────────────────────────────
            // Rotation depends on runs physically RUN (bat + byes/leg-byes + overthrows),
            // not on the penalty runs. Odd no-ball bat runs and odd byes/leg-byes rotate.
            const runsRun = (0, scoringLogic_1.calculateRunsRun)(runsScored, extraTypeMapped, extraRuns);
            const rotate = (0, scoringLogic_1.shouldRotateStrike)(runsRun, isEndOfOver);
            // End-of-over always swaps; mid-over swap only on odd runs
            strikeSwapped = isEndOfOver || rotate;
            // ── Player stats ────────────────────────────────────────────────────────
            // Batsman on strike faces the ball
            await (0, playerStatsService_1.incrementBattingStats)(matchIdStr, freshInnings.inningsNumber, batsman.statsKey, {
                runs: runsScored,
                ballFaced: legal ? 1 : 0,
                isBoundaryFour: runsScored === 4,
                isBoundarySix: runsScored === 6,
                isOut: isWicket && batsmanOnStrikeId === (dismissedPlayerId ?? batsmanOnStrikeId),
                dismissalType: isWicket && batsmanOnStrikeId === (dismissedPlayerId ?? batsmanOnStrikeId) ? wicketType : null,
            }, session);
            // Non-striker dismissed (e.g. run-out at the bowler's end)
            const nonStrikerDismissed = isWicket && dismissedPlayerId != null && dismissedPlayerId === nonStrikerId;
            if (nonStrikerDismissed) {
                await (0, playerStatsService_1.incrementBattingStats)(matchIdStr, freshInnings.inningsNumber, nonStrk.statsKey, {
                    runs: 0,
                    ballFaced: 0,
                    isBoundaryFour: false,
                    isBoundarySix: false,
                    isOut: true,
                    dismissalType: wicketType,
                }, session);
            }
            // Runs chargeable to bowler:
            // wide: wides bucket (already includes 1 penalty) + no bat runs
            // noball: 1 penalty + bat runs (extraRuns are field runs, not bat)
            // bye/legbye: not charged to bowler
            // normal: bat runs only
            const runsChargedToBowler = (() => {
                if (extraTypeMapped === 'wide')
                    return extrasBreakdown.wides; // 1 + overthrows
                if (extraTypeMapped === 'noball')
                    return 1 + runsScored; // penalty + bat
                return runsScored; // normal / bye / legbye
            })();
            await (0, playerStatsService_1.incrementBowlingStats)(matchIdStr, freshInnings.inningsNumber, bowler.statsKey, {
                ballBowled: legal ? 1 : 0,
                runsConceded: runsChargedToBowler,
                isWicket: isWicket && !['runout'].includes(wicketType || ''),
            }, session);
            // ── Check innings / match completion ──────────────────────────────────
            const targetChased = freshInnings.inningsNumber === 2 &&
                freshInnings.target != null &&
                freshInnings.totalRuns >= freshInnings.target;
            const battingTeamSize = freshInnings.battingTeam === 'teamA' ? match.teamA.players.length : match.teamB.players.length;
            // In individualBattingMode every player can bat alone, so all wickets must fall
            // before the innings ends. In normal mode it's the usual N-1 rule.
            const allOutWickets = match.individualBattingMode ? battingTeamSize : Math.max(0, battingTeamSize - 1);
            if (targetChased ||
                freshInnings.totalWickets >= allOutWickets ||
                freshInnings.oversCompleted >= match.oversFormat) {
                completionResult = await (0, matchCompletionService_1.checkAndHandleCompletion)(freshInnings, match, session);
            }
        });
        const needsNewBatsman = isWicket && !completionResult.inningsComplete && !completionResult.matchComplete;
        res.status(201).json({
            ball,
            innings: {
                totalRuns: freshInnings.totalRuns,
                totalWickets: freshInnings.totalWickets,
                oversCompleted: freshInnings.oversCompleted,
                ballsInCurrentOver: freshInnings.ballsInCurrentOver,
                extras: freshInnings.extras,
                target: freshInnings.target ?? null,
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
                totalRuns: freshInnings.totalRuns,
                totalWickets: freshInnings.totalWickets,
                oversCompleted: freshInnings.oversCompleted,
                ballsInCurrentOver: freshInnings.ballsInCurrentOver,
                extras: freshInnings.extras,
                target: freshInnings.target ?? null,
            };
            const eventFlags = {
                strikeSwapped,
                isEndOfOver,
                needsNewBatsman,
                inningsComplete: completionResult.inningsComplete,
                matchComplete: completionResult.matchComplete,
                resultText: completionResult.resultText || null,
            };
            liveMatchSocket_1.liveMatchNamespace.to(room).emit('ball:recorded', { ball, innings: inningsSnapshot, flags: eventFlags });
            if (isWicket) {
                liveMatchSocket_1.liveMatchNamespace.to(room).emit('wicket:fallen', {
                    ball, dismissedPlayerId, wicketType, fielderId, innings: inningsSnapshot,
                });
            }
            if (completionResult.inningsComplete && !completionResult.matchComplete) {
                liveMatchSocket_1.liveMatchNamespace.to(room).emit('innings:completed', {
                    completedInningsNumber: match.currentInnings,
                    innings: inningsSnapshot,
                    target: freshInnings.inningsNumber === 1 ? freshInnings.totalRuns + 1 : null,
                    resultText: completionResult.resultText || null,
                });
            }
            if (completionResult.matchComplete) {
                liveMatchSocket_1.liveMatchNamespace.to(room).emit('match:completed', {
                    resultText: completionResult.resultText || null,
                    innings: inningsSnapshot,
                });
            }
        }
        catch (emitErr) {
            console.error('[live-match] emit error in recordBall:', emitErr);
        }
    }
    catch (err) {
        next(err);
    }
    finally {
        session.endSession();
    }
}
// ── DELETE /api/scoring/matches/:matchId/balls/last ───────────────────────────
async function undoLastBall(req, res, next) {
    const session = await mongoose_1.default.startSession();
    try {
        const { matchId } = req.params;
        const matchIdStr = Array.isArray(matchId) ? matchId[0] : matchId;
        let match = req.scoringMatch;
        if (!['live', 'innings_break', 'completed'].includes(match.status)) {
            throw new errors_1.BadRequestError('Match is not in an undoable state');
        }
        let lastBall;
        let innings;
        let attempt = 0;
        await session.withTransaction(async () => {
            // This handler mutates `match` in memory, so re-read it on a retry to
            // discard mutations from the rolled-back attempt.
            if (attempt++ > 0) {
                const reloaded = await ScoringMatch_1.default.findById(matchIdStr).session(session);
                if (!reloaded)
                    throw new errors_1.NotFoundError('Match');
                match = reloaded;
            }
            // When at innings_break, undo targets the last ball of innings 1
            const targetInningsNumber = match.status === 'innings_break' ? 1 : match.currentInnings;
            const foundInnings = await Innings_1.default.findOne({
                matchId: matchIdStr,
                inningsNumber: targetInningsNumber,
            }).session(session);
            if (!foundInnings)
                throw new errors_1.NotFoundError('Current innings');
            innings = foundInnings;
            // Find the most recent ball for this innings
            const foundBall = await Ball_1.default.findOne({ inningsId: innings._id })
                .sort({ _id: -1 })
                .session(session);
            if (!foundBall)
                throw new errors_1.BadRequestError('No balls recorded in this innings yet');
            lastBall = foundBall;
            // ── Reverse innings totals ──────────────────────────────────────────────
            const deliveryRuns = (0, scoringLogic_1.totalDeliveryRuns)(lastBall.runsScored, lastBall.extraRuns, lastBall.extraType);
            const extrasBreakdown = (0, scoringLogic_1.calculateExtrasBreakdown)(lastBall.extraType, lastBall.extraRuns, lastBall.noballExtraKind);
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
            // If the innings was previously completed, reset the flag —
            // the next ball recorded will re-evaluate completion conditions.
            if (innings.isCompleted) {
                innings.isCompleted = false;
            }
            await innings.save({ session });
            // ── Reverse match/innings-break status ──────────────────────────
            const wasCompleted = match.status === 'completed';
            const wasInningsBreak = match.status === 'innings_break';
            if (wasCompleted) {
                match.status = 'live';
                match.result = null;
                match.statsProcessed = false;
                await match.save({ session });
            }
            if (wasInningsBreak) {
                match.status = 'live';
                match.currentInnings = 1;
                match.statsProcessed = false;
                await match.save({ session });
                await Innings_1.default.deleteOne({
                    matchId: matchIdStr,
                    inningsNumber: 2,
                }, { session });
            }
            // ── Reverse player stats ────────────────────────────────────────────────
            // Reconstruct stats keys from the saved ball (handles both ObjectId and guest fields)
            const undoBatsmanKey = lastBall.batsmanOnStrikeId
                ? lastBall.batsmanOnStrikeId.toString()
                : { guestName: lastBall.guestBatsman ?? '' };
            const undoBowlerKey = lastBall.bowlerId
                ? lastBall.bowlerId.toString()
                : { guestName: lastBall.guestBowler ?? '' };
            await (0, playerStatsService_1.decrementBattingStats)(matchIdStr, innings.inningsNumber, undoBatsmanKey, {
                runs: lastBall.runsScored,
                ballFaced: lastBall.isLegalDelivery ? 1 : 0,
                isBoundaryFour: lastBall.runsScored === 4,
                isBoundarySix: lastBall.runsScored === 6,
                isOut: lastBall.isWicket &&
                    (lastBall.dismissedPlayerId?.toString() === lastBall.batsmanOnStrikeId?.toString() ||
                        (lastBall.guestDismissed != null && lastBall.guestDismissed === lastBall.guestBatsman)),
                dismissalType: lastBall.wicketType,
            }, session);
            // Non-striker dismissed reversal
            const nonStrikerDismissed = lastBall.isWicket && ((lastBall.dismissedPlayerId && lastBall.nonStrikerId && lastBall.dismissedPlayerId.toString() === lastBall.nonStrikerId.toString()) ||
                (lastBall.guestDismissed != null && lastBall.guestDismissed === lastBall.guestNonStriker));
            if (nonStrikerDismissed) {
                const undoNonStrikerKey = lastBall.nonStrikerId
                    ? lastBall.nonStrikerId.toString()
                    : { guestName: lastBall.guestNonStriker ?? '' };
                await (0, playerStatsService_1.decrementBattingStats)(matchIdStr, innings.inningsNumber, undoNonStrikerKey, {
                    runs: 0,
                    ballFaced: 0,
                    isBoundaryFour: false,
                    isBoundarySix: false,
                    isOut: true,
                    dismissalType: lastBall.wicketType,
                }, session);
            }
            const runsChargedToBowler = (() => {
                if (lastBall.extraType === 'wide')
                    return extrasBreakdown.wides;
                if (lastBall.extraType === 'noball')
                    return 1 + (lastBall.runsScored || 0);
                return lastBall.runsScored || 0;
            })();
            await (0, playerStatsService_1.decrementBowlingStats)(matchIdStr, innings.inningsNumber, undoBowlerKey, {
                ballBowled: lastBall.isLegalDelivery ? 1 : 0,
                runsConceded: runsChargedToBowler,
                isWicket: lastBall.isWicket && !['runout'].includes(lastBall.wicketType || ''),
            }, session);
            // ── Delete the ball ─────────────────────────────────────────────────────
            await Ball_1.default.deleteOne({ _id: lastBall._id }, { session });
        });
        res.json({
            undone: lastBall,
            matchStatus: match.status,
            innings: {
                totalRuns: innings.totalRuns,
                totalWickets: innings.totalWickets,
                oversCompleted: innings.oversCompleted,
                ballsInCurrentOver: innings.ballsInCurrentOver,
                extras: innings.extras,
                target: innings.target ?? null,
            },
        });
        // ── Phase 3: broadcast undo to /live-match namespace ─────────────────────
        try {
            liveMatchSocket_1.liveMatchNamespace.to(`match_${matchIdStr}`).emit('ball:undone', {
                undone: lastBall,
                matchStatus: match.status,
                innings: {
                    totalRuns: innings.totalRuns,
                    totalWickets: innings.totalWickets,
                    oversCompleted: innings.oversCompleted,
                    ballsInCurrentOver: innings.ballsInCurrentOver,
                    extras: innings.extras,
                    target: innings.target ?? null,
                },
            });
        }
        catch (emitErr) {
            console.error('[live-match] emit error in undoLastBall:', emitErr);
        }
    }
    catch (err) {
        next(err);
    }
    finally {
        session.endSession();
    }
}
//# sourceMappingURL=ballController.js.map