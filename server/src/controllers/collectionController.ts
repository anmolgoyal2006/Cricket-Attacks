import { Response, NextFunction } from 'express';
import User from '../models/User';
import Player from '../models/Player';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { parsePagination, parseSort, paginationResponse } from '../utils/helpers';

export async function getCollection(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const sort = parseSort(req.query, '-overall');

    const user = await User.findById(req.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Fetch all unique players — use find with lean, preserving all IDs including duplicates
    const uniquePlayerIds = [...new Set(user.ownedCards.map(id => id.toString()))];
    const uniquePlayers = await Player.find({ _id: { $in: uniquePlayerIds } }).lean();
    const playerMap = new Map(uniquePlayers.map(p => [p._id.toString(), p]));

    // Build full list including duplicates, skipping any orphaned IDs
    let allCards = user.ownedCards.map((playerId, index) => {
      const player = playerMap.get(playerId.toString());
      if (!player) return null;
      return {
        ...player,
        cardId: `${playerId}_${index}`,
        level: 1,
        xp: 0,
        battlesPlayed: 0,
        battlesWon: 0,
      };
    }).filter(Boolean) as any[];

    // Prune stale IDs from the user document so counts stay accurate going forward
    const validOwnedCards = user.ownedCards.filter(id => playerMap.has(id.toString()));
    if (validOwnedCards.length !== user.ownedCards.length) {
      await User.updateOne({ _id: user._id }, { $set: { ownedCards: validOwnedCards } });
    }

    // Apply filters
    if (req.query.role) {
      const roleRegex = new RegExp(req.query.role as string, 'i');
      allCards = allCards.filter(card => roleRegex.test(card.role));
    }
    if (req.query.rarity) {
      const rarityRegex = new RegExp(`^${req.query.rarity}$`, 'i');
      allCards = allCards.filter(card => rarityRegex.test(card.rarity));
    }

    // Apply sorting
    allCards.sort((a, b) => {
      if (sort.startsWith('-')) {
        const field = sort.slice(1);
        return (b[field] || 0) - (a[field] || 0);
      }
      if (sort === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return (a[sort] || 0) - (b[sort] || 0);
    });

    const total = allCards.length;
    const paginatedCards = allCards.slice(skip, skip + limit);

    res.json({
      cards: paginatedCards,
      pagination: paginationResponse(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function getCollectionStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Only count cards whose player documents actually exist
    const uniquePlayerIds = [...new Set(user.ownedCards.map(id => id.toString()))];
    const existingPlayers = await Player.find({ _id: { $in: uniquePlayerIds } }).lean();
    const playerMap = new Map(existingPlayers.map(p => [p._id.toString(), p]));

    // Filter ownedCards to only valid (non-orphaned) entries
    const validOwnedCards = user.ownedCards.filter(id => playerMap.has(id.toString()));

    // Prune stale IDs from the user document so the count stays accurate going forward
    if (validOwnedCards.length !== user.ownedCards.length) {
      await User.updateOne({ _id: user._id }, { $set: { ownedCards: validOwnedCards } });
    }

    // Build an array of rarities for all valid owned cards (including duplicates)
    const allRarities = validOwnedCards.map(id => {
      const player = playerMap.get(id.toString());
      return player?.rarity;
    }).filter(Boolean) as string[];

    // Calculate rarity breakdown
    const rarityCounts: Record<string, number> = {};
    allRarities.forEach(rarity => {
      rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
    });

    const rarityBreakdown = Object.entries(rarityCounts).map(([rarity, count]) => ({
      rarity,
      count,
    }));

    res.json({
      stats: {
        totalCards: validOwnedCards.length,
        totalRarity: rarityBreakdown.length,
        uniquePlayers: new Set(validOwnedCards.map(id => id.toString())).size,
      },
      rarityBreakdown,
    });
  } catch (error) {
    next(error);
  }
}

export async function addToCollection(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      throw new BadRequestError('Player ID is required');
    }

    const player = await Player.findById(playerId);
    if (!player) {
      throw new NotFoundError('Player');
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { ownedCards: playerId } },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      message: 'Card added to collection',
      totalCards: user.ownedCards.length,
    });
  } catch (error) {
    next(error);
  }
}
