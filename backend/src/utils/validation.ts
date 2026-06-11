import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from './errors';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const startBattleSchema = z.object({
  squadCardIds: z.array(z.string()).min(5, 'You need exactly 5 cards').max(5, 'You can only select 5 cards'),
});

export const playRoundSchema = z.object({
  playerCardId: z.string().min(1, 'Player card ID is required'),
});

export const openPackSchema = z.object({
  packType: z.enum(['basic', 'premium', 'legendary'], {
    errorMap: () => ({ message: 'Pack type must be basic, premium, or legendary' }),
  }),
});

export function validate(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new BadRequestError(message);
    }
    req.body = result.data;
    next();
  };
}
