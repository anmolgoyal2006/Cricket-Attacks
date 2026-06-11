import { Request, Response, NextFunction } from 'express';
import Player from '../models/Player';
import { NotFoundError } from '../utils/errors';
import { parsePagination, parseSort, paginationResponse } from '../utils/helpers';

export async function getAllPlayers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const sort = parseSort(req.query, '-overall');

    const filter: Record<string, any> = {};

    if (req.query.role) {
      filter.role = { $regex: req.query.role, $options: 'i' };
    }
    if (req.query.rarity) {
      filter.rarity = { $regex: `^${req.query.rarity}$`, $options: 'i' };
    }
    if (req.query.country) {
      filter.country = { $regex: req.query.country, $options: 'i' };
    }
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }
    if (req.query.minOverall) {
      filter.overall = { $gte: parseInt(req.query.minOverall as string) };
    }

    const [cards, total] = await Promise.all([
      Player.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Player.countDocuments(filter),
    ]);

    res.json({
      cards,
      pagination: paginationResponse(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function getPlayerById(req: Request, res: Response, next: NextFunction) {
  try {
    const player = await Player.findById(req.params.id).lean();
    if (!player) {
      throw new NotFoundError('Player');
    }
    res.json({ card: player });
  } catch (error) {
    next(error);
  }
}
