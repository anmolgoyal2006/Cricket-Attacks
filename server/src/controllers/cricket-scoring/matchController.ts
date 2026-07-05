/**
 * Cricket Scoring Feature — Phase 2
 * Match controller: create, list, detail, add/remove scorers, start match.
 */

import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import { parsePagination, paginationResponse } from '../../utils/helpers';
import ScoringMatch from '../../models/cricket-scoring/ScoringMatch';
import Innings from '../../models/cricket-scoring/Innings';

// ── POST /api/scoring/matches ─────────────────────────────────────────────────
export async function createMatch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { teamA, teamB, oversFormat, tossWonBy, tossDecision, venue, scorers } = req.body;

    if (!teamA?.name || !teamA?.players?.length) {
      throw new BadRequestError('teamA must have a name and at least one player');
    }
    if (!teamB?.name || !teamB?.players?.length) {
      throw new BadRequestError('teamB must have a name and at least one player');
    }
    if (!oversFormat || oversFormat <= 0) {
      throw new BadRequestError('oversFormat must be a positive number');
    }
    if (!['teamA', 'teamB'].includes(tossWonBy)) {
      throw new BadRequestError('tossWonBy must be "teamA" or "teamB"');
    }
    if (!['bat', 'bowl'].includes(tossDecision)) {
      throw new BadRequestError('tossDecision must be "bat" or "bowl"');
    }

    const match = await ScoringMatch.create({
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
  } catch (err) {
    next(err);
  }
}

// ── GET /api/scoring/matches ──────────────────────────────────────────────────
export async function listMatches(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter: Record<string, any> = {};
    if (req.query.status) filter.status = req.query.status;

    const [matches, total] = await Promise.all([
      ScoringMatch.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ScoringMatch.countDocuments(filter),
    ]);

    res.json({ matches, pagination: paginationResponse(total, page, limit) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/scoring/matches/:id ──────────────────────────────────────────────
export async function getMatch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const match = await ScoringMatch.findById(req.params.id)
      .populate('teamA.players', 'username')
      .populate('teamB.players', 'username')
      .populate('createdBy', 'username')
      .populate('scorers', 'username')
      .lean();

    if (!match) throw new NotFoundError('Match');

    // Attach current innings summary
    const currentInnings = await Innings.findOne({
      matchId: match._id,
      inningsNumber: match.currentInnings,
    }).lean();

    res.json({ match: { ...match, currentInningsSummary: currentInnings || null } });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/scoring/matches/:id/scorers ────────────────────────────────────
export async function updateScorers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const match = await ScoringMatch.findById(req.params.id);
    if (!match) throw new NotFoundError('Match');
    if (match.createdBy.toString() !== req.userId) {
      throw new UnauthorizedError('Only the match creator can manage scorers');
    }

    const { add = [], remove = [] } = req.body;

    const addIds = add.map((id: string) => new mongoose.Types.ObjectId(id));
    const removeIds = remove.map((id: string) => id.toString());

    // Remove first, then add (de-dupe via Set)
    const filtered = match.scorers.filter((s) => !removeIds.includes(s.toString()));
    const existing = new Set(filtered.map((s) => s.toString()));
    for (const id of addIds) {
      if (!existing.has(id.toString())) filtered.push(id);
    }

    match.scorers = filtered;
    await match.save();

    res.json({ scorers: match.scorers });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/scoring/matches/:id/start ─────────────────────────────────────
export async function startMatch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const match = await ScoringMatch.findById(req.params.id);
    if (!match) throw new NotFoundError('Match');
    if (match.status !== 'upcoming') {
      throw new BadRequestError('Match has already started or is completed');
    }

    // Determine which team bats first based on toss
    const battingTeam =
      match.tossDecision === 'bat'
        ? match.tossWonBy
        : match.tossWonBy === 'teamA'
        ? 'teamB'
        : 'teamA';
    const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';

    // Create first innings
    await Innings.create({
      matchId: match._id,
      inningsNumber: 1,
      battingTeam,
      bowlingTeam,
    });

    match.status = 'live';
    match.currentInnings = 1;
    await match.save();

    res.json({ match, message: `Match started — ${battingTeam} batting first` });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/scoring/matches/:matchId/balls ───────────────────────────────────
// Returns ball-by-ball feed for a match, newest first. Public (authenticated only).
// Phase 5 addition — purely additive, no existing controller code changed.
export async function getBalls(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { matchId } = req.params;
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200);
    const skip = parseInt((req.query.skip as string) || '0', 10);

    const BallModel = (await import('../../models/cricket-scoring/Ball')).default;

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
  } catch (err) {
    next(err);
  }
}

// ── GET /api/scoring/matches/:matchId/stats ───────────────────────────────────
// Returns per-player batting + bowling stats for a match. Used for scorecards.
// Phase 5 addition — purely additive.
export async function getMatchStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { matchId } = req.params;

    const PlayerMatchStats = (await import('../../models/cricket-scoring/PlayerMatchStats')).default;

    const stats = await PlayerMatchStats.find({ matchId })
      .populate('playerId', 'username')
      .lean();

    res.json({ stats });
  } catch (err) {
    next(err);
  }
}
