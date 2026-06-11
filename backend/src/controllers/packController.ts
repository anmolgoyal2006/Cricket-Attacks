import { Response, NextFunction } from 'express';
import User from '../models/User';
import PackOpening from '../models/PackOpening';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { openPack } from '../services/packService';
import { parsePagination, paginationResponse } from '../utils/helpers';

export async function getPackInfo(_req: AuthRequest, res: Response) {
  res.json({
    packs: [
      {
        type: 'basic',
        name: 'Basic Pack',
        description: '3 cards, mostly common',
        cost: 200,
        cards: 3,
        rarity: { Common: '60%', Rare: '25%', Epic: '12%', Legend: '3%' },
      },
      {
        type: 'premium',
        name: 'Premium Pack',
        description: '5 cards, better odds',
        cost: 500,
        cards: 5,
        rarity: { Common: '30%', Rare: '35%', Epic: '25%', Legend: '10%' },
      },
      {
        type: 'legendary',
        name: 'Legendary Pack',
        description: '7 cards, best odds for epic and legendary',
        cost: 1000,
        cards: 7,
        rarity: { Common: '10%', Rare: '20%', Epic: '40%', Legend: '30%' },
      },
    ],
  });
}

export async function openPackHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { packType } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const packConfigs: Record<string, { cost: number; name: string }> = {
      basic: { cost: 0, name: 'Daily Free Pack' },
      premium: { cost: 500, name: 'Premium Pack' },
      legendary: { cost: 1000, name: 'Legendary Pack' },
    };

    const packConfig = packConfigs[packType];
    if (!packConfig) {
      throw new BadRequestError('Invalid pack type');
    }

    if (user.coins < packConfig.cost) {
      throw new BadRequestError(
        `Not enough coins. You need ${packConfig.cost} coins to open a ${packConfig.name}`
      );
    }

    if (packType === 'basic') {
      const now = new Date();
      const lastDaily = user.dailyPackOpenedAt;
      if (lastDaily) {
        const hoursSinceLastDaily = (now.getTime() - new Date(lastDaily).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastDaily < 24) {
          const hoursLeft = Math.ceil(24 - hoursSinceLastDaily);
          throw new BadRequestError(
            `Daily free pack already opened. Come back in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`
          );
        }
      }
    }

    const { cards, cost } = await openPack(packType);

    const cardIds = cards.map((c) => c._id);

    user.coins -= cost;
    user.packsOpened += 1;
    user.ownedCards.push(...cardIds);

    if (packType === 'basic') {
      user.dailyPackOpenedAt = new Date();
    }

    await user.save();

    await PackOpening.create({
      user: user._id,
      packType,
      cards: cardIds,
      cost,
    });

    res.json({
      results: cards.map((c) => ({
        _id: c._id,
        name: c.name,
        role: c.role,
        country: c.country,
        batting: c.batting,
        bowling: c.bowling,
        fielding: c.fielding,
        overall: c.overall,
        rarity: c.rarity,
        specialty: c.specialty,
        image: c.image,
        formats: c.formats,
      })),
      coins: user.coins,
      dailyPackOpenedAt: user.dailyPackOpenedAt?.toISOString() || null,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPackHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [openings, total] = await Promise.all([
      PackOpening.find({ user: req.userId })
        .populate('cards', 'name role rarity overall image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PackOpening.countDocuments({ user: req.userId }),
    ]);

    res.json({
      openings,
      pagination: paginationResponse(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
}
