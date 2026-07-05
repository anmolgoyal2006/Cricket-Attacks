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

import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth';
import { BadRequestError, NotFoundError } from '../../utils/errors';
// Cricket Scoring Feature — Phase 3: live broadcasting (import after namespace is wired)
import { liveMatchNamespace } from '../../socket/liveMatchSocket';
import ScoringMatch from '../../models/cricket-scoring/ScoringMatch';
import Innings from '../../models/cricket-scoring/Innings';
import BallModel from '../../models/cricket-scoring/Ball';
import {
  isLegalDelivery,
  shouldRotateStrike,
  calculateOverBall,
  calculateExtrasBreakdown,
  totalDeliveryRuns,
  ExtraType,
} from '../../utils/scoringLogic';
import {
  incrementBattingStats,
  decrementBattingStats,
  incrementBowlingStats,
  decrementBowlingStats,
} from '../../services/playerStatsService';
import { checkAndHandleCompletion } from '../../services/matchCompletionService';

// ── Helper: resolve "guest:Name" or real ObjectId string ─────────────────────
// The client sends "guest:<displayName>" for players without accounts.
// Returns the correct DB fields and the PlayerKey for stats upserts.
const GUEST_PREFIX = 'guest:';

function resolvePlayer(raw: string | null | undefined): {
  id: mongoose.Types.ObjectId | null;
  guestName: string | null;
  statsKey: mongoose.Types.ObjectId | string | { guestName: string };
} {
  if (!raw) return { id: null, guestName: null, statsKey: '' };
  if (raw.startsWith(GUEST_PREFIX)) {
    const name = raw.slice(GUEST_PREFIX.length);
    return { id: null, guestName: name, statsKey: { guestName: name } };
  }
  return { id: new mongoose.Types.ObjectId(raw), guestName: null, statsKey: raw };
}

// ── POST /api/scoring/matches/:matchId/balls ──────────────────────────────────
export async function recordBall(req: AuthRequest, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { matchId } = req.params;
    const matchIdStr: string = Array.isArray(matchId) ? matchId[0] : matchId;
    const {
      runsScored = 0,
      extraType = null,
      extraRuns = 0,
      isWicket = false,
      wicketType = null,
      dismissedPlayerId = null,
      fielderId = null,
      bowlerId,
      batsmanOnStrikeId,
      nonStrikerId,
    } = req.body as {
      runsScored?: number;
      extraType?: ExtraType;
      extraRuns?: number;
      isWicket?: boolean;
      wicketType?: string | null;
      dismissedPlayerId?: string | null;
      fielderId?: string | null;
      bowlerId: string;
      batsmanOnStrikeId: string;
      nonStrikerId: string;
    };

    if (!bowlerId || !batsmanOnStrikeId || !nonStrikerId) {
      throw new BadRequestError('bowlerId, batsmanOnStrikeId, nonStrikerId are required');
    }

    // Resolve player ids — support both real ObjectIds and "guest:<name>" tokens
    const bowler   = resolvePlayer(bowlerId);
    const batsman  = resolvePlayer(batsmanOnStrikeId);
    const nonStrk  = resolvePlayer(nonStrikerId);
    const dismissed = resolvePlayer(dismissedPlayerId);
    const fielder   = resolvePlayer(fielderId);

    // Normalise extraType: frontend sends camelCase ('noBall','legBye') but
    // backend ExtraType uses lowercase ('noball','legbye'). Map here once.
    const extraTypeMapped: ExtraType = (() => {
      if (!extraType) return null;
      const map: Record<string, ExtraType> = {
        wide: 'wide', Wide: 'wide',
        noBall: 'noball', noball: 'noball', 'no-ball': 'noball', NoBall: 'noball',
        bye: 'bye', Bye: 'bye',
        legBye: 'legbye', legbye: 'legbye', 'leg-bye': 'legbye', LegBye: 'legbye',
      };
      return map[extraType as string] ?? (extraType as ExtraType);
    })();

    const match = await ScoringMatch.findById(matchIdStr).session(session);
    if (!match) throw new NotFoundError('Match');
    if (match.status !== 'live') throw new BadRequestError('Match is not live');

    const innings = await Innings.findOne({
      matchId: matchIdStr,
      inningsNumber: match.currentInnings,
      isCompleted: false,
    }).session(session);
    if (!innings) throw new NotFoundError('Active innings');

    // ── Over / ball position ──────────────────────────────────────────────────
    const legal = isLegalDelivery(extraTypeMapped);

    // Atomically read-and-increment ballsInCurrentOver so concurrent requests
    // can never read the same stale value. findOneAndUpdate with new:false
    // returns the document BEFORE the increment, giving us the pre-update counts.
    // For illegal deliveries (wide/no-ball) we don't increment — just read.
    const inningsBeforeUpdate = await Innings.findOneAndUpdate(
      { _id: innings._id, isCompleted: false },
      legal ? { $inc: { ballsInCurrentOver: 1 } } : {},
      { new: false, session }
    );
    if (!inningsBeforeUpdate) throw new BadRequestError('Innings already completed');

    // Re-read the current innings doc (with any increments applied) for use below
    const freshInnings = await Innings.findById(innings._id).session(session);
    if (!freshInnings) throw new NotFoundError('Active innings');

    // Use the PRE-increment values to determine this ball's position
    const prevOversCompleted = inningsBeforeUpdate.oversCompleted;
    const prevBallsInOver   = inningsBeforeUpdate.ballsInCurrentOver;

    const { over, ballsInCurrentOver, oversCompleted, isEndOfOver } = calculateOverBall(
      prevOversCompleted,
      prevBallsInOver,
      legal
    );

    // ballNumber for storage: 1-indexed legal ball within the over
    const ballNumber = legal ? prevBallsInOver + 1 : prevBallsInOver;

    // If the atomic $inc just completed this over (ballsInCurrentOver hit 6),
    // fix up the innings doc inside the transaction
    if (legal && ballNumber === 6) {
      freshInnings.oversCompleted = prevOversCompleted + 1;
      freshInnings.ballsInCurrentOver = 0;
    } else if (legal) {
      // The $inc already wrote ballsInCurrentOver+1; nothing else needed here
      freshInnings.ballsInCurrentOver = prevBallsInOver + 1;
    }
    // For illegal deliveries freshInnings reflects the unmodified state — correct

    // ── Extras breakdown ──────────────────────────────────────────────────────
    const extrasBreakdown = calculateExtrasBreakdown(extraTypeMapped, extraRuns);
    const deliveryRuns = totalDeliveryRuns(runsScored, extraRuns, extraTypeMapped);

    // ── Save ball ─────────────────────────────────────────────────────────────
    const [ball] = await BallModel.create(
      [
        {
          matchId: matchIdStr,
          inningsId: freshInnings._id,
          over: prevOversCompleted,
          ballNumber,
          bowlerId:          bowler.id,
          batsmanOnStrikeId: batsman.id,
          nonStrikerId:      nonStrk.id,
          guestBowler:       bowler.guestName,
          guestBatsman:      batsman.guestName,
          guestNonStriker:   nonStrk.guestName,
          runsScored,
          extraType: extraTypeMapped || null,
          extraRuns,
          isWicket,
          wicketType: isWicket ? wicketType : null,
          dismissedPlayerId: isWicket ? dismissed.id   : null,
          guestDismissed:    isWicket ? dismissed.guestName : null,
          fielderId:         fielder.id,
          guestFielder:      fielder.guestName,
          isLegalDelivery: legal,
          timestamp: new Date(),
        },
      ],
      { session }
    );

    // ── Update innings totals ─────────────────────────────────────────────────
    freshInnings.totalRuns += deliveryRuns;
    freshInnings.extras.wides += extrasBreakdown.wides;
    freshInnings.extras.noBalls += extrasBreakdown.noBalls;
    freshInnings.extras.byes += extrasBreakdown.byes;
    freshInnings.extras.legByes += extrasBreakdown.legByes;

    if (isWicket) freshInnings.totalWickets += 1;

    // ballsInCurrentOver / oversCompleted already updated above via $inc + fixup
    await freshInnings.save({ session });

    // ── Strike rotation ───────────────────────────────────────────────────────
    const rotate = shouldRotateStrike(runsScored, legal, isEndOfOver);
    // End-of-over always swaps; mid-over swap only on odd runs
    const strikeSwapped = isEndOfOver || rotate;

    // ── Player stats ──────────────────────────────────────────────────────────
    // Batsman on strike faces the ball
    await incrementBattingStats(
      matchIdStr,
      batsman.statsKey,
      {
        runs: runsScored,
        ballFaced: legal ? 1 : 0,
        isBoundaryFour: runsScored === 4,
        isBoundarySix: runsScored === 6,
        isOut: isWicket && batsmanOnStrikeId === (dismissedPlayerId ?? batsmanOnStrikeId),
        dismissalType: isWicket && batsmanOnStrikeId === (dismissedPlayerId ?? batsmanOnStrikeId) ? wicketType : null,
      },
      session
    );

    // Runs chargeable to bowler:
    // wide: wides bucket (already includes 1 penalty) + no bat runs
    // noball: 1 penalty + bat runs (extraRuns are field runs, not bat)
    // bye/legbye: not charged to bowler
    // normal: bat runs only
    const runsChargedToBowler = (() => {
      if (extraTypeMapped === 'wide') return extrasBreakdown.wides; // 1 + overthrows
      if (extraTypeMapped === 'noball') return 1 + runsScored;      // penalty + bat
      return runsScored; // normal / bye / legbye
    })();

    await incrementBowlingStats(
      matchIdStr,
      bowler.statsKey,
      {
        ballBowled: legal ? 1 : 0,
        runsConceded: runsChargedToBowler,
        isWicket: isWicket && !['runout'].includes(wicketType || ''),
      },
      session
    );

    // ── Check innings / match completion ──────────────────────────────────────
    const targetChased =
      freshInnings.inningsNumber === 2 &&
      freshInnings.target != null &&
      freshInnings.totalRuns >= freshInnings.target;

    let completionResult: { inningsComplete: boolean; matchComplete: boolean; resultText?: string } = {
      inningsComplete: false,
      matchComplete: false,
      resultText: undefined,
    };

    const battingTeamSize = freshInnings.battingTeam === 'teamA' ? match.teamA.players.length : match.teamB.players.length;
    if (
      targetChased ||
      freshInnings.totalWickets >= Math.max(0, battingTeamSize - 1) ||
      freshInnings.oversCompleted >= match.oversFormat
    ) {
      completionResult = await checkAndHandleCompletion(freshInnings, match, session);
    }

    await session.commitTransaction();
    session.endSession();

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

      liveMatchNamespace.to(room).emit('ball:recorded', { ball, innings: inningsSnapshot, flags: eventFlags });

      if (isWicket) {
        liveMatchNamespace.to(room).emit('wicket:fallen', {
          ball, dismissedPlayerId, wicketType, fielderId, innings: inningsSnapshot,
        });
      }

      if (completionResult.inningsComplete && !completionResult.matchComplete) {
        liveMatchNamespace.to(room).emit('innings:completed', {
          completedInningsNumber: match.currentInnings,
          innings: inningsSnapshot,
          target: freshInnings.inningsNumber === 1 ? freshInnings.totalRuns + 1 : null,
          resultText: completionResult.resultText || null,
        });
      }

      if (completionResult.matchComplete) {
        liveMatchNamespace.to(room).emit('match:completed', {
          resultText: completionResult.resultText || null,
          innings: inningsSnapshot,
        });
      }
    } catch (emitErr) {
      console.error('[live-match] emit error in recordBall:', emitErr);
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

// ── DELETE /api/scoring/matches/:matchId/balls/last ───────────────────────────
export async function undoLastBall(req: AuthRequest, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { matchId } = req.params;
    const matchIdStr: string = Array.isArray(matchId) ? matchId[0] : matchId;

    const match = await ScoringMatch.findById(matchIdStr).session(session);
    if (!match) throw new NotFoundError('Match');
    if (match.status !== 'live') throw new BadRequestError('Match is not live — cannot undo');

    const innings = await Innings.findOne({
      matchId: matchIdStr,
      inningsNumber: match.currentInnings,
    }).session(session);
    if (!innings) throw new NotFoundError('Current innings');

    // Find the most recent ball for this innings
    const lastBall = await BallModel.findOne({ inningsId: innings._id })
      .sort({ _id: -1 })
      .session(session);

    if (!lastBall) throw new BadRequestError('No balls recorded in this innings yet');

    // ── Reverse innings totals ────────────────────────────────────────────────
    const deliveryRuns = totalDeliveryRuns(lastBall.runsScored, lastBall.extraRuns, lastBall.extraType as ExtraType);
    const extrasBreakdown = calculateExtrasBreakdown(lastBall.extraType as ExtraType, lastBall.extraRuns);

    innings.totalRuns = Math.max(0, innings.totalRuns - deliveryRuns);
    innings.extras.wides = Math.max(0, innings.extras.wides - extrasBreakdown.wides);
    innings.extras.noBalls = Math.max(0, innings.extras.noBalls - extrasBreakdown.noBalls);
    innings.extras.byes = Math.max(0, innings.extras.byes - extrasBreakdown.byes);
    innings.extras.legByes = Math.max(0, innings.extras.legByes - extrasBreakdown.legByes);

    if (lastBall.isWicket) innings.totalWickets = Math.max(0, innings.totalWickets - 1);

    if (lastBall.isLegalDelivery) {
      // Were we at the start of a fresh over?
      if (innings.ballsInCurrentOver === 0 && innings.oversCompleted > 0) {
        innings.oversCompleted -= 1;
        innings.ballsInCurrentOver = 5; // rewind to 5 balls in previous over
      } else {
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

    await decrementBattingStats(
      matchIdStr,
      undoBatsmanKey,
      {
        runs: lastBall.runsScored,
        ballFaced: lastBall.isLegalDelivery ? 1 : 0,
        isBoundaryFour: lastBall.runsScored === 4,
        isBoundarySix: lastBall.runsScored === 6,
        isOut: lastBall.isWicket &&
          (lastBall.dismissedPlayerId?.toString() === lastBall.batsmanOnStrikeId?.toString() ||
           (lastBall.guestDismissed != null && lastBall.guestDismissed === lastBall.guestBatsman)),
        dismissalType: lastBall.wicketType,
      },
      session
    );

    const runsChargedToBowler =
      lastBall.runsScored +
      extrasBreakdown.wides +
      extrasBreakdown.noBalls +
      extrasBreakdown.byes +
      extrasBreakdown.legByes;

    await decrementBowlingStats(
      matchIdStr,
      undoBowlerKey,
      {
        ballBowled: lastBall.isLegalDelivery ? 1 : 0,
        runsConceded: runsChargedToBowler,
        isWicket: lastBall.isWicket && !['runout'].includes(lastBall.wicketType || ''),
      },
      session
    );

    // ── Delete the ball ───────────────────────────────────────────────────────
    await BallModel.deleteOne({ _id: lastBall._id }, { session });

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
        target: innings.target ?? null,
      },
    });

    // ── Phase 3: broadcast undo to /live-match namespace ─────────────────────
    try {
      liveMatchNamespace.to(`match_${matchIdStr}`).emit('ball:undone', {
        undone: lastBall,
        innings: {
          totalRuns: innings.totalRuns,
          totalWickets: innings.totalWickets,
          oversCompleted: innings.oversCompleted,
          ballsInCurrentOver: innings.ballsInCurrentOver,
          extras: innings.extras,
          target: innings.target ?? null,
        },
      });
    } catch (emitErr) {
      console.error('[live-match] emit error in undoLastBall:', emitErr);
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}
