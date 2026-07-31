/**
 * Cricket Scoring Feature — Phase 2
 * Middleware: only the match creator or a listed scorer may record/undo balls.
 * Expects req.params.matchId to be set by the router.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import ScoringMatch, { IScoringMatch } from '../models/cricket-scoring/ScoringMatch';

export async function isScorerOrCreator(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const matchId = req.params.matchId || req.params.id;
    // Not .lean() — downstream handlers mutate and .save() this document.
    const match = await ScoringMatch.findById(matchId);
    if (!match) throw new NotFoundError('Match');

    const userId = req.userId!;
    const isCreator = match.createdBy.toString() === userId;
    const isScorer = match.scorers.some((s) => s.toString() === userId);

    if (!isCreator && !isScorer) {
      throw new UnauthorizedError('You are not authorized to score this match');
    }

    req.scoringMatch = match;
    next();
  } catch (err) {
    next(err);
  }
}
