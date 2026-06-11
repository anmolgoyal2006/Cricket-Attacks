import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Player from '../models/Player';
import Battle from '../models/Battle';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { startBattle, playRound, calculateRewards } from '../services/battleService';
import { updateLeaderboardForUser } from '../services/leaderboardService';
import { parsePagination, paginationResponse } from '../utils/helpers';

export async function startPvE(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { squadCardIds } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const playerCards = await Player.find({ _id: { $in: squadCardIds } });
    if (playerCards.length !== 5) {
      throw new BadRequestError('Some selected cards were not found');
    }

    for (const cardId of squadCardIds) {
      if (!user.ownedCards.some((c) => c.toString() === cardId)) {
        throw new BadRequestError('You do not own all selected cards');
      }
    }

    const { aiCards, playerHand, attributeOrder } = startBattle(playerCards);

    const battle = await Battle.create({
      user: user._id,
      playerSquad: squadCardIds,
      aiSquad: aiCards,
      attributeOrder,
      playerScore: 0,
      computerScore: 0,
      type: 'pve',
      status: 'in_progress',
    });

    res.json({
      battleId: battle._id,
      playerCards: playerHand,
      aiCards,
      attributeOrder,
      currentRound: 0,
      totalRounds: 5,
    });
  } catch (error) {
    next(error);
  }
}

export async function playRoundHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { battleId } = req.params;
    const { playerCardId } = req.body;

    const battle = await Battle.findById(battleId).populate('playerSquad');
    if (!battle) {
      throw new NotFoundError('Battle');
    }

    if (battle.user.toString() !== req.userId) {
      throw new BadRequestError('This is not your battle');
    }

    if (battle.status === 'completed') {
      throw new BadRequestError('Battle is already completed');
    }

    const aiCards = battle.aiSquad.filter(
      (ai: any) => !battle.rounds.some((r: any) => (r.aiId ? r.aiId === ai.aiId : r.computerCardName === ai.name))
    );

    if (aiCards.length === 0) {
      throw new BadRequestError('No AI cards remaining');
    }

    const result = playRound(battle, aiCards, playerCardId);

    if (result.computerCard) {
      battle.aiSquad = battle.aiSquad.map((ai: any) => ({
        ...ai,
        used: result.computerCard.aiId
          ? ai.aiId === result.computerCard.aiId || ai.used
          : ai.name === result.computerCard.name || ai.used,
      }));
    }

    const roundResult: any = {
      roundNumber: result.roundNumber,
      playerCardId: new mongoose.Types.ObjectId(playerCardId),
      playerCardName: result.playerCard.name,
      playerStat: result.playerCard.stat,
      attribute: result.attribute,
      aiId: result.computerCard.aiId,
      computerCardName: result.computerCard.name,
      computerStat: result.computerCard.stat,
      winner: result.winner as 'player' | 'computer' | 'tie',
    };

    battle.rounds.push(roundResult);
    battle.playerScore = result.playerScore;
    battle.computerScore = result.computerScore;

    if (result.isOver) {
      battle.status = 'completed';

      if (result.battleResult) {
        battle.winner = result.battleResult as 'player' | 'computer' | 'tie';

        if (result.battleResult === 'player') {
          battle.rewards.coins = result.trophiesEarned * 5;
          battle.rewards.xp = result.xpEarned;
          battle.rewards.trophies = result.trophiesEarned;
        } else if (result.battleResult === 'computer') {
          battle.rewards.coins = result.trophiesEarned * 5;
          battle.rewards.xp = result.xpEarned;
          battle.rewards.trophies = result.trophiesEarned;
        } else {
          battle.rewards.coins = result.trophiesEarned * 5;
          battle.rewards.xp = result.xpEarned;
          battle.rewards.trophies = result.trophiesEarned;
        }

        const rewards = await calculateRewards(result.battleResult);

        await User.findByIdAndUpdate(req.userId, {
          $inc: {
            coins: rewards.coins,
            xp: rewards.xp,
            trophies: result.battleResult === 'player' ? rewards.trophies : 0,
            battlesPlayed: 1,
            wins: result.battleResult === 'player' ? 1 : 0,
            losses: result.battleResult === 'computer' ? 1 : 0,
          },
        });

        await updateLeaderboardForUser(req.userId!);

        result.trophiesEarned = rewards.trophies;
        result.xpEarned = rewards.xp;
      }
    }

    await battle.save();

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getBattleById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const battle = await Battle.findById(req.params.id)
      .populate('playerSquad')
      .populate('rewards.cardDrops')
      .lean();

    if (!battle) {
      throw new NotFoundError('Battle');
    }

    if (battle.user.toString() !== req.userId) {
      throw new BadRequestError('This is not your battle');
    }

    res.json({ battle });
  } catch (error) {
    next(error);
  }
}

export async function getBattleHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [battles, total] = await Promise.all([
      Battle.find({ user: req.userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Battle.countDocuments({ user: req.userId, status: 'completed' }),
    ]);

    res.json({
      battles: battles.map((b) => ({
        ...b,
        winner: b.winner,
        playerScore: b.playerScore,
        computerScore: b.computerScore,
        trophiesEarned: b.rewards?.trophies || 0,
        xpEarned: b.rewards?.xp || 0,
        createdAt: b.createdAt,
        type: b.type,
      })),
      pagination: paginationResponse(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
}
