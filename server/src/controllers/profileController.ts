import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import MatchHistory from '../models/MatchHistory';
import Battle from '../models/Battle';
import { NotFoundError } from '../utils/errors';
import { getNextTierProgress } from '../services/eloService';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean();
    if (!user) throw new NotFoundError('User');

    const recentMatches = await MatchHistory.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const totalBattles = user.battlesPlayed || 0;
    const winRate = totalBattles > 0 ? Math.round(((user.wins || 0) / totalBattles) * 100) : 0;

    const tierProgress = getNextTierProgress(user.eloRating || 1000);

    const recentBattles = await Battle.find({ user: id, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('playerSquad', 'name role batting bowling fielding captaincy pressure overall')
      .lean();

    res.json({
      profile: {
        id: user._id,
        username: user.username,
        eloRating: user.eloRating || 1000,
        highestElo: user.highestElo || 1000,
        rankTier: user.rankTier || 'Bronze',
        trophies: user.trophies || 0,
        level: user.level || 1,
        xp: user.xp || 0,
        wins: user.wins || 0,
        losses: user.losses || 0,
        draws: user.draws || 0,
        battlesPlayed: totalBattles,
        winRate,
        battleStreak: user.battleStreak || 0,
        longestStreak: user.longestStreak || 0,
        coins: user.coins || 0,
        createdAt: user.createdAt,
        ...tierProgress,
      },
      recentMatches,
      recentBattles,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) throw new NotFoundError('User');

    const totalBattles = user.battlesPlayed || 0;
    const winRate = totalBattles > 0 ? Math.round(((user.wins || 0) / totalBattles) * 100) : 0;
    const tierProgress = getNextTierProgress(user.eloRating || 1000);

    res.json({
      profile: {
        id: user._id,
        username: user.username,
        email: user.email,
        eloRating: user.eloRating || 1000,
        highestElo: user.highestElo || 1000,
        rankTier: user.rankTier || 'Bronze',
        trophies: user.trophies || 0,
        level: user.level || 1,
        xp: user.xp || 0,
        coins: user.coins || 0,
        wins: user.wins || 0,
        losses: user.losses || 0,
        draws: user.draws || 0,
        battlesPlayed: totalBattles,
        winRate,
        battleStreak: user.battleStreak || 0,
        longestStreak: user.longestStreak || 0,
        ownedCards: user.ownedCards?.length || 0,
        packsOpened: user.packsOpened || 0,
        createdAt: user.createdAt,
        ...tierProgress,
      },
    });
  } catch (error) {
    next(error);
  }
}
