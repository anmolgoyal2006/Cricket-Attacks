/**
 * Cricket Scoring Feature — Phase 2
 * Stats controller: career stats, match history, scoring leaderboard.
 * Kept separate from the existing card-game leaderboard.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { parsePagination, paginationResponse } from '../../utils/helpers';
import PlayerCareerStats from '../../models/cricket-scoring/PlayerCareerStats';
import PlayerMatchStats from '../../models/cricket-scoring/PlayerMatchStats';
import ScoringMatch from '../../models/cricket-scoring/ScoringMatch';

// ── GET /api/stats/player/:playerId/career ────────────────────────────────────
export async function getPlayerCareerStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { playerId } = req.params;
    const stats = await PlayerCareerStats.findOne({ playerId })
      .populate('playerId', 'username')
      .lean();

    if (!stats) throw new NotFoundError('Career stats');

    res.json({ stats });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/stats/player/:playerId/matches ───────────────────────────────────
export async function getPlayerMatchHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { playerId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);

    const [matchStats, total] = await Promise.all([
      PlayerMatchStats.find({ playerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'matchId',
          select: 'teamA teamB status result createdAt oversFormat',
          model: ScoringMatch,
        })
        .lean(),
      PlayerMatchStats.countDocuments({ playerId }),
    ]);

    res.json({ matchStats, pagination: paginationResponse(total, page, limit) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/stats/leaderboard?type=runs|wickets|average ─────────────────────
export async function getScoringLeaderboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const type = (req.query.type as string) || 'runs';
    const validTypes = ['runs', 'wickets', 'average'];
    if (!validTypes.includes(type)) {
      throw new BadRequestError(`type must be one of: ${validTypes.join(', ')}`);
    }

    const sortField: Record<string, string> = {
      runs: 'totalRuns',
      wickets: 'totalWickets',
      average: 'battingAverage',
    };

    const topPlayers = await PlayerCareerStats.find()
      .sort({ [sortField[type]]: -1 })
      .limit(10)
      .populate('playerId', 'username')
      .lean();

    res.json({ leaderboard: topPlayers, type });
  } catch (err) {
    next(err);
  }
}
