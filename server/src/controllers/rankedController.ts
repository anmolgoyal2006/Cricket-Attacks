import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Battle from '../models/Battle';
import MatchHistory from '../models/MatchHistory';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { calculateElo, getTier } from '../services/eloService';
import { getWinRewards } from '../services/rewardsService';
import { updateLeaderboardForUser } from '../services/leaderboardService';

export async function completeRankedBattle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { battleId, opponentId, playerScore, opponentScore, isDraw } = req.body;

    const battle = await Battle.findById(battleId);
    if (!battle) throw new NotFoundError('Battle');

    const [player, opponent] = await Promise.all([
      User.findById(req.userId),
      User.findById(opponentId),
    ]);
    if (!player || !opponent) throw new NotFoundError('User');

    let winner: 'player' | 'opponent' | 'draw';
    if (isDraw) winner = 'draw';
    else if (playerScore > opponentScore) winner = 'player';
    else winner = 'opponent';

    const eloResult = calculateElo(
      player.eloRating,
      opponent.eloRating,
      winner === 'player' ? 1 : winner === 'draw' ? 0.5 : 0,
      winner === 'opponent' ? 1 : winner === 'draw' ? 0.5 : 0
    );

    const playerNewTier = getTier(eloResult.newRatingA);
    const opponentNewTier = getTier(eloResult.newRatingB);

    const streak = player.battleStreak || 0;
    const newStreak = winner === 'player' ? streak + 1 : 0;
    const rewards = getWinRewards(winner === 'player', winner === 'draw', newStreak);

    await Promise.all([
      User.findByIdAndUpdate(player._id, {
        $set: {
          eloRating: eloResult.newRatingA,
          rankTier: playerNewTier,
          battleStreak: newStreak,
          highestElo: Math.max(player.highestElo, eloResult.newRatingA),
        },
        $inc: {
          coins: rewards.coins,
          xp: rewards.xp,
          battlesPlayed: 1,
          wins: winner === 'player' ? 1 : 0,
          losses: winner === 'opponent' ? 1 : 0,
          draws: winner === 'draw' ? 1 : 0,
        },
      }),
      User.findByIdAndUpdate(opponent._id, {
        $set: {
          eloRating: eloResult.newRatingB,
          rankTier: opponentNewTier,
          battleStreak: winner === 'opponent' ? (opponent.battleStreak || 0) + 1 : 0,
          highestElo: Math.max(opponent.highestElo, eloResult.newRatingB),
        },
        $inc: {
          battlesPlayed: 1,
          wins: winner === 'opponent' ? 1 : 0,
          losses: winner === 'player' ? 1 : 0,
          draws: winner === 'draw' ? 1 : 0,
        },
      }),
    ]);

    await Promise.all([
      updateLeaderboardForUser(player._id.toString()),
      updateLeaderboardForUser(opponent._id.toString()),
    ]);

    const historyPlayer = await MatchHistory.create({
      user: player._id,
      opponentId: opponent._id,
      opponentName: opponent.username,
      result: winner === 'player' ? 'win' : winner === 'draw' ? 'draw' : 'loss',
      eloChange: eloResult.changeA,
      eloBefore: player.eloRating,
      eloAfter: eloResult.newRatingA,
      playerScore,
      opponentScore,
      attributeOrder: battle.attributeOrder,
      type: 'ranked',
      season: 1,
    });

    const historyOpponent = await MatchHistory.create({
      user: opponent._id,
      opponentId: player._id,
      opponentName: player.username,
      result: winner === 'opponent' ? 'win' : winner === 'draw' ? 'draw' : 'loss',
      eloChange: eloResult.changeB,
      eloBefore: opponent.eloRating,
      eloAfter: eloResult.newRatingB,
      playerScore: opponentScore,
      opponentScore: playerScore,
      attributeOrder: battle.attributeOrder,
      type: 'ranked',
      season: 1,
    });

    battle.status = 'completed';
    battle.winner = winner === 'player' ? 'player' : winner === 'opponent' ? 'computer' : 'tie';
    await battle.save();

    res.json({
      winner,
      eloChange: eloResult.changeA,
      newElo: eloResult.newRatingA,
      newTier: playerNewTier,
      playerScore,
      opponentScore,
      rewards,
      historyId: historyPlayer._id,
    });
  } catch (error) {
    next(error);
  }
}
