import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Player from '../models/Player';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { UnauthorizedError, ConflictError } from '../utils/errors';
import { updateLeaderboardForUser } from '../services/leaderboardService';

function generateToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

function sanitizeUser(user: any) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    displayName: user.username,
    trophies: user.trophies,
    level: user.level,
    coins: user.coins,
    stats: {
      battlesPlayed: user.battlesPlayed,
      battlesWon: user.wins,
      totalPacksOpened: user.packsOpened,
      totalCardsCollected: user.ownedCards?.length || 0,
    },
    dailyPackOpenedAt: user.dailyPackOpenedAt,
    createdAt: user.createdAt,
  };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictError(
        existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken'
      );
    }

    // 5 random starter cards
    const starterCards = await Player.aggregate([{ $sample: { size: 5 } }]);
    const starterCardIds = starterCards.map((c) => c._id);

    // Welcome bonus: 1 Rare + 1 Legend card
    const [rareBonus] = await Player.aggregate([
      { $match: { rarity: 'Rare' } },
      { $sample: { size: 1 } },
    ]);
    const [legendBonus] = await Player.aggregate([
      { $match: { rarity: 'Legend' } },
      { $sample: { size: 1 } },
    ]);

    const bonusCards = [rareBonus, legendBonus].filter(Boolean);
    const bonusCardIds = bonusCards.map((c) => c._id);

    const user = await User.create({
      username,
      email,
      password,
      ownedCards: [...starterCardIds, ...bonusCardIds],
    });
    await updateLeaderboardForUser(user._id.toString());

    const token = generateToken(user._id.toString());

    res.status(201).json({
      token,
      user: sanitizeUser(user),
      welcomeBonus: bonusCards.map((c) => ({
        _id: c._id,
        name: c.name,
        rarity: c.rarity,
        overall: c.overall,
        country: c.country,
        role: c.role,
        image: c.image,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken(user._id.toString());

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function claimCoins(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    user.coins += 500;
    await user.save();

    res.json({
      coins: user.coins,
      user: sanitizeUser(user),
      message: 'Claimed 500 coins successfully!',
    });
  } catch (error) {
    next(error);
  }
}
