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

    // Fetch all unique players first
    const uniquePlayers = await Player.find({ _id: { $in: user.ownedCards } }).lean();
    const playerMap = new Map(uniquePlayers.map(p => [p._id.toString(), p]));

    // Build full list including duplicates, and add a unique cardId for each instance
    let allCards = user.ownedCards.map((playerId, index) => {
      const player = playerMap.get(playerId.toString());
      if (!player) return null;
      return {
        ...player,
        cardId: `${playerId}_${index}`, // unique ID for each copy
        level: 1, // default values for now
        xp: 0,
        battlesPlayed: 0,
        battlesWon: 0,
      };
    }).filter(Boolean) as any[];

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

    // Get unique player data for each owned card (including duplicates)
    const uniquePlayers = await Player.find({ _id: { $in: user.ownedCards } }).lean();
    const playerMap = new Map(uniquePlayers.map(p => [p._id.toString(), p]));
    
    // Build an array of rarities for all owned cards
    const allRarities = user.ownedCards.map(id => {
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
        totalCards: user.ownedCards.length,
        totalRarity: rarityBreakdown.length,
        uniquePlayers: new Set(user.ownedCards.map(id => id.toString())).size,
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
