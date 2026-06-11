import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import MatchHistory from '../models/MatchHistory';
import { parsePagination, paginationResponse } from '../utils/helpers';

export async function getMatchHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter: any = { user: req.userId };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.result) filter.result = req.query.result;

    const [matches, total] = await Promise.all([
      MatchHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MatchHistory.countDocuments(filter),
    ]);

    res.json({
      matches,
      pagination: paginationResponse(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMatchHistoryByUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);

    const [matches, total] = await Promise.all([
      MatchHistory.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MatchHistory.countDocuments({ user: userId }),
    ]);

    res.json({
      matches,
      pagination: paginationResponse(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
}
