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

    // Extract actual player IDs from cardIds (cardId may be "playerId_index" or just "playerId")
    const actualPlayerIds = squadCardIds.map((cardId: string) => {
      if (!cardId) throw new BadRequestError('Invalid card ID in squad');
      const raw = cardId.includes('_') ? cardId.split('_')[0] : cardId;
      if (!mongoose.isValidObjectId(raw)) {
        throw new BadRequestError(`Invalid card ID format: ${cardId}`);
      }
      return raw;
    });

    // Fetch unique player documents (duplicates allowed in squad — fetch by unique IDs)
    const uniquePlayerIds = [...new Set(actualPlayerIds)];
    const foundPlayers = await Player.find({ _id: { $in: uniquePlayerIds } });
    const playerMap = new Map(foundPlayers.map((p: any) => [p._id.toString(), p]));

    // Build the ordered playerCards array preserving duplicates
    const playerCards = actualPlayerIds.map((id: string) => playerMap.get(id)).filter(Boolean);
    if (playerCards.length !== 5) {
      const missing = actualPlayerIds.filter((id: string) => !playerMap.has(id));
      throw new BadRequestError(`Some selected cards were not found (IDs: ${missing.join(', ')})`);
    }

    // Verify ownership — each selected playerId must appear in ownedCards
    const ownedSet = new Set(user.ownedCards.map((c: any) => c.toString()));
    for (const playerId of actualPlayerIds) {
      if (!ownedSet.has(playerId)) {
        throw new BadRequestError('You do not own all selected cards');
      }
    }

    // Create playerHand with original cardIds as userCardId
    const { aiCards, playerHand: rawPlayerHand, attributeOrder } = startBattle(playerCards);
    // Add the original cardId to each playerHand entry
    const playerHand = rawPlayerHand.map((card: any, index: number) => ({
      ...card,
      userCardId: squadCardIds[index]
    }));

    const battle = await Battle.create({
      user: user._id,
      playerSquad: actualPlayerIds, // Store actual player IDs in DB
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

function pickSmartAICard(available: any[], attribute: string): any {
  const useSmartPick = Math.random() < 0.7;
  if (useSmartPick) {
    return [...available].sort((a, b) => (b[attribute] ?? 0) - (a[attribute] ?? 0))[0];
  }
  return available[Math.floor(Math.random() * available.length)];
}

export async function computerPickHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { battleId } = req.params;

    const battle = await Battle.findById(battleId);
    if (!battle) throw new NotFoundError('Battle');
    if (battle.user.toString() !== req.userId) throw new BadRequestError('This is not your battle');
    if (battle.status === 'completed') throw new BadRequestError('Battle is already completed');

    // Clear any previous pending pick (safety)
    battle.aiSquad = battle.aiSquad.map((ai: any) => ({ ...ai, pendingPick: false }));

    // Available = not used and no previous round recorded for this aiId
    const available = battle.aiSquad.filter(
      (ai: any) => !ai.used && !battle.rounds.some((r: any) => r.aiId === ai.aiId || r.computerCardName === ai.name)
    );

    if (available.length === 0) throw new BadRequestError('No AI cards remaining');

    // Pick smartly: 70% best card for this round's attribute, 30% random
    const currentAttribute = battle.attributeOrder[battle.rounds.length] || 'batting';
    const picked = pickSmartAICard(available, currentAttribute);

    // Mark as pending in aiSquad
    battle.aiSquad = battle.aiSquad.map((ai: any) =>
      ai.aiId === picked.aiId ? { ...ai, pendingPick: true } : ai
    );
    battle.markModified('aiSquad');
    await battle.save();

    // Return name + role only — no stats revealed to frontend yet
    res.json({
      computerCard: {
        name: picked.name,
        role: picked.role,
        aiId: picked.aiId,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function playRoundHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { battleId } = req.params;
    let { playerCardId } = req.body;

    // Extract actual player ID from userCardId if needed
    const actualPlayerId = playerCardId.includes('_') ? playerCardId.split('_')[0] : playerCardId;

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

    // Use the pre-picked card if available, otherwise fall back to random (handles legacy/direct calls)
    const pendingPick = battle.aiSquad.find((ai: any) => ai.pendingPick);
    const aiCardsForRound = pendingPick
      ? battle.aiSquad.filter((ai: any) => ai.aiId === pendingPick.aiId)
      : aiCards;

    const result = playRound(battle, aiCardsForRound, actualPlayerId);
    let rewards: any = null;

    if (result.computerCard) {
      battle.aiSquad = battle.aiSquad.map((ai: any) => ({
        ...ai,
        pendingPick: false, // clear pending pick
        used: result.computerCard.aiId
          ? ai.aiId === result.computerCard.aiId || ai.used
          : ai.name === result.computerCard.name || ai.used,
      }));
    }

    if (!result.computerCard || !result.computerCard.name) {
      console.error('Missing computerCard.name in playRound result:', JSON.stringify(result.computerCard));
    }

    const roundResult: any = {
      roundNumber: result.roundNumber,
      playerCardId: new mongoose.Types.ObjectId(actualPlayerId),
      playerCardName: result.playerCard.name,
      playerStat: result.playerCard.stat,
      attribute: result.attribute,
      aiId: result.computerCard?.aiId,
      computerCardName: result.computerCard?.name || 'Unknown AI',
      computerStat: result.computerCard?.stat ?? 0,
      winner: result.winner as 'player' | 'computer' | 'tie',
    };

    battle.rounds.push(roundResult);
    battle.playerScore = result.playerScore;
    battle.computerScore = result.computerScore;

    if (result.isOver) {
      battle.status = 'completed';

      if (result.battleResult) {
        battle.winner = result.battleResult as 'player' | 'computer' | 'tie';

        rewards = await calculateRewards(result.battleResult);

        battle.rewards.coins = rewards.coins;
        battle.rewards.xp = rewards.xp;
        battle.rewards.trophies = rewards.trophies;

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

    res.json({
      ...result,
      coinsEarned: rewards?.coins ?? 0,
    });
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
