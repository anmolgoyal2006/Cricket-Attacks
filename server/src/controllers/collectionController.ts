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

    const playerFilter: Record<string, any> = {
      _id: { $in: user.ownedCards },
    };

    if (req.query.role) {
      playerFilter.role = { $regex: req.query.role, $options: 'i' };
    }
    if (req.query.rarity) {
      playerFilter.rarity = { $regex: `^${req.query.rarity}$`, $options: 'i' };
    }

    const [cards, total] = await Promise.all([
      Player.find(playerFilter).sort(sort).skip(skip).limit(limit).lean(),
      Player.countDocuments(playerFilter),
    ]);

    res.json({
      cards,
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

    const rarityBreakdown = await Player.aggregate([
      { $match: { _id: { $in: user.ownedCards } } },
      { $group: { _id: '$rarity', count: { $sum: 1 } } },
    ]);

    res.json({
      stats: {
        totalCards: user.ownedCards.length,
        totalRarity: rarityBreakdown.length,
        uniquePlayers: user.ownedCards.length,
      },
      rarityBreakdown: rarityBreakdown.map((r: any) => ({
        rarity: r._id,
        count: r.count,
      })),
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
