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
  NoballExtraKind,
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

  try {
    const { matchId } = req.params;
    const matchIdStr: string = Array.isArray(matchId) ? matchId[0] : matchId;
    const {
      runsScored = 0,
      extraType = null,
      extraRuns = 0,
      noballExtraKind = null,
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
      noballExtraKind?: NoballExtraKind | null;
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

    // Loaded by the isScorerOrCreator middleware — no second query needed.
    let match = req.scoringMatch!;
    if (match.status !== 'live') throw new BadRequestError('Match is not live');

    const legal = isLegalDelivery(extraTypeMapped);
    const extrasBreakdown = calculateExtrasBreakdown(extraTypeMapped, extraRuns, noballExtraKind);
    const deliveryRuns = totalDeliveryRuns(runsScored, extraRuns, extraTypeMapped);

    // Declared outside the transaction callback because withTransaction may
    // re-run the callback on a transient write conflict.
    let ball!: mongoose.Document;
    let freshInnings!: InstanceType<typeof Innings>;
    let isEndOfOver = false;
    let strikeSwapped = false;
    let attempt = 0;
    let completionResult: { inningsComplete: boolean; matchComplete: boolean; resultText?: string } = {
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
        const reloaded = await ScoringMatch.findById(matchIdStr).session(session);
        if (!reloaded) throw new NotFoundError('Match');
        match = reloaded;
      }

      // ── Single atomic innings update ────────────────────────────────────────
      // Every mutation is expressed as arithmetic over the stored field, so two
      // concurrent balls can never clobber each other's totals. The over rollover
      // is decided server-side from the on-disk ball count.
      const updated = await Innings.findOneAndUpdate(
        {
          matchId: new mongoose.Types.ObjectId(matchIdStr),
          inningsNumber: match.currentInnings,
          isCompleted: false,
        },
        [
          {
            $set: {
              totalRuns:        { $add: [{ $ifNull: ['$totalRuns', 0] }, deliveryRuns] },
              totalWickets:     { $add: [{ $ifNull: ['$totalWickets', 0] }, isWicket ? 1 : 0] },
              'extras.wides':   { $add: [{ $ifNull: ['$extras.wides', 0] }, extrasBreakdown.wides] },
              'extras.noBalls': { $add: [{ $ifNull: ['$extras.noBalls', 0] }, extrasBreakdown.noBalls] },
              'extras.byes':    { $add: [{ $ifNull: ['$extras.byes', 0] }, extrasBreakdown.byes] },
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
        ],
        { new: true, session }
      );
      if (!updated) throw new NotFoundError('Active innings');
      freshInnings = updated;

      // ── Recover this ball's position from the post-update state ─────────────
      // The DB already applied the rollover, so invert the known delta.
      let prevOversCompleted: number;
      let prevBallsInOver: number;
      if (!legal) {
        prevOversCompleted = freshInnings.oversCompleted;
        prevBallsInOver = freshInnings.ballsInCurrentOver;
      } else if (freshInnings.ballsInCurrentOver === 0) {
        prevOversCompleted = freshInnings.oversCompleted - 1;
        prevBallsInOver = 5;
      } else {
        prevOversCompleted = freshInnings.oversCompleted;
        prevBallsInOver = freshInnings.ballsInCurrentOver - 1;
      }

      ({ isEndOfOver } = calculateOverBall(prevOversCompleted, prevBallsInOver, legal));

      // ballNumber for storage: 1-indexed legal ball within the over
      const ballNumber = legal ? prevBallsInOver + 1 : prevBallsInOver;

      // ── Save ball ───────────────────────────────────────────────────────────
      [ball] = await BallModel.create(
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
            noballExtraKind: extraTypeMapped === 'noball' ? (noballExtraKind || 'overthrow') : null,
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

      // ── Strike rotation ─────────────────────────────────────────────────────
      const rotate = shouldRotateStrike(runsScored, legal, isEndOfOver);
      // End-of-over always swaps; mid-over swap only on odd runs
      strikeSwapped = isEndOfOver || rotate;

      // ── Player stats ────────────────────────────────────────────────────────
      // Batsman on strike faces the ball
      await incrementBattingStats(
        matchIdStr,
        freshInnings.inningsNumber as 1 | 2,
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

      // Non-striker dismissed (e.g. run-out at the bowler's end)
      const nonStrikerDismissed = isWicket && dismissedPlayerId != null && dismissedPlayerId === nonStrikerId;
      if (nonStrikerDismissed) {
        await incrementBattingStats(
          matchIdStr,
          freshInnings.inningsNumber as 1 | 2,
          nonStrk.statsKey,
          {
            runs: 0,
            ballFaced: 0,
            isBoundaryFour: false,
            isBoundarySix: false,
            isOut: true,
            dismissalType: wicketType,
          },
          session
        );
      }

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
        freshInnings.inningsNumber as 1 | 2,
        bowler.statsKey,
        {
          ballBowled: legal ? 1 : 0,
          runsConceded: runsChargedToBowler,
          isWicket: isWicket && !['runout'].includes(wicketType || ''),
        },
        session
      );

      // ── Check innings / match completion ──────────────────────────────────
      const targetChased =
        freshInnings.inningsNumber === 2 &&
        freshInnings.target != null &&
        freshInnings.totalRuns >= freshInnings.target;

      const battingTeamSize = freshInnings.battingTeam === 'teamA' ? match.teamA.players.length : match.teamB.players.length;
      // In individualBattingMode every player can bat alone, so all wickets must fall
      // before the innings ends. In normal mode it's the usual N-1 rule.
      const allOutWickets = match.individualBattingMode ? battingTeamSize : Math.max(0, battingTeamSize - 1);
      if (
        targetChased ||
        freshInnings.totalWickets >= allOutWickets ||
        freshInnings.oversCompleted >= match.oversFormat
      ) {
        completionResult = await checkAndHandleCompletion(freshInnings, match, session);
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
    next(err);
  } finally {
    session.endSession();
  }
}

// ── DELETE /api/scoring/matches/:matchId/balls/last ───────────────────────────
export async function undoLastBall(req: AuthRequest, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();

  try {
    const { matchId } = req.params;
    const matchIdStr: string = Array.isArray(matchId) ? matchId[0] : matchId;

    let match = req.scoringMatch!;
    if (!['live', 'innings_break', 'completed'].includes(match.status)) {
      throw new BadRequestError('Match is not in an undoable state');
    }

    let lastBall!: InstanceType<typeof BallModel>;
    let innings!: InstanceType<typeof Innings>;
    let attempt = 0;

    await session.withTransaction(async () => {
      // This handler mutates `match` in memory, so re-read it on a retry to
      // discard mutations from the rolled-back attempt.
      if (attempt++ > 0) {
        const reloaded = await ScoringMatch.findById(matchIdStr).session(session);
        if (!reloaded) throw new NotFoundError('Match');
        match = reloaded;
      }

      // When at innings_break, undo targets the last ball of innings 1
      const targetInningsNumber = match.status === 'innings_break' ? 1 : match.currentInnings;

      const foundInnings = await Innings.findOne({
        matchId: matchIdStr,
        inningsNumber: targetInningsNumber,
      }).session(session);
      if (!foundInnings) throw new NotFoundError('Current innings');
      innings = foundInnings;

      // Find the most recent ball for this innings
      const foundBall = await BallModel.findOne({ inningsId: innings._id })
        .sort({ _id: -1 })
        .session(session);

      if (!foundBall) throw new BadRequestError('No balls recorded in this innings yet');
      lastBall = foundBall;

      // ── Reverse innings totals ──────────────────────────────────────────────
      const deliveryRuns = totalDeliveryRuns(lastBall.runsScored, lastBall.extraRuns, lastBall.extraType as ExtraType);
      const extrasBreakdown = calculateExtrasBreakdown(lastBall.extraType as ExtraType, lastBall.extraRuns, lastBall.noballExtraKind as NoballExtraKind | null);

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
        await (match as any).save({ session });
      }

      if (wasInningsBreak) {
        match.status = 'live';
        match.currentInnings = 1;
        match.statsProcessed = false;
        await (match as any).save({ session });

        await Innings.deleteOne({
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

      await decrementBattingStats(
        matchIdStr,
        innings.inningsNumber as 1 | 2,
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

      // Non-striker dismissed reversal
      const nonStrikerDismissed = lastBall.isWicket && (
        (lastBall.dismissedPlayerId && lastBall.nonStrikerId && lastBall.dismissedPlayerId.toString() === lastBall.nonStrikerId.toString()) ||
        (lastBall.guestDismissed != null && lastBall.guestDismissed === lastBall.guestNonStriker)
      );
      if (nonStrikerDismissed) {
        const undoNonStrikerKey = lastBall.nonStrikerId
          ? lastBall.nonStrikerId.toString()
          : { guestName: lastBall.guestNonStriker ?? '' };

        await decrementBattingStats(
          matchIdStr,
          innings.inningsNumber as 1 | 2,
          undoNonStrikerKey,
          {
            runs: 0,
            ballFaced: 0,
            isBoundaryFour: false,
            isBoundarySix: false,
            isOut: true,
            dismissalType: lastBall.wicketType,
          },
          session
        );
      }

      const runsChargedToBowler = (() => {
        if (lastBall.extraType === 'wide') return extrasBreakdown.wides;
        if (lastBall.extraType === 'noball') return 1 + (lastBall.runsScored || 0);
        return lastBall.runsScored || 0;
      })();

      await decrementBowlingStats(
        matchIdStr,
        innings.inningsNumber as 1 | 2,
        undoBowlerKey,
        {
          ballBowled: lastBall.isLegalDelivery ? 1 : 0,
          runsConceded: runsChargedToBowler,
          isWicket: lastBall.isWicket && !['runout'].includes(lastBall.wicketType || ''),
        },
        session
      );

      // ── Delete the ball ─────────────────────────────────────────────────────
      await BallModel.deleteOne({ _id: lastBall._id }, { session });
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
      liveMatchNamespace.to(`match_${matchIdStr}`).emit('ball:undone', {
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
    } catch (emitErr) {
      console.error('[live-match] emit error in undoLastBall:', emitErr);
    }
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
}
