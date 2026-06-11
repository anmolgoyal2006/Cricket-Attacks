import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getLeaderboard, getMyRank, getLeaderboardBySeason } from '../services/leaderboardService';

export async function getLeaderboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const season = req.query.season ? parseInt(req.query.season as string) : undefined;

    let leaderboard: any[];
    if (season !== undefined) {
      leaderboard = await getLeaderboardBySeason(season, limit);
    } else {
      leaderboard = await getLeaderboard(limit);
    }

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
}

export async function getMyRankHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const season = req.query.season ? parseInt(req.query.season as string) : undefined;
    const rank = await getMyRank(req.userId!, season);
    res.json(rank || {
      rank: 0, userId: req.userId, username: '', eloRating: 1000,
      rankTier: 'Bronze', trophies: 0, battlesWon: 0, battlesPlayed: 0, winRate: 0, streak: 0,
    });
  } catch (error) {
    next(error);
  }
}
