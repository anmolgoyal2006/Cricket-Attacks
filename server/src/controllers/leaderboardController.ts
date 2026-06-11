import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getLeaderboard, getMyRank } from '../services/leaderboardService';

export async function getLeaderboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const leaderboard = await getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
}

export async function getMyRankHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rank = await getMyRank(req.userId!);
    res.json(rank || { rank: 0, username: '', trophies: 0, battlesWon: 0, battlesPlayed: 0, winRate: 0 });
  } catch (error) {
    next(error);
  }
}
