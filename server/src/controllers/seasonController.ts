import { Response, NextFunction } from 'express';
import Season from '../models/Season';

export async function getCurrentSeason(_req: any, res: Response, next: NextFunction) {
  try {
    const season = await Season.findOne({ isActive: true }).sort({ seasonNumber: -1 }).lean();

    if (!season) {
      const firstSeason = await Season.create({
        seasonNumber: 1,
        name: 'Season 1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
      });
      res.json({ season: firstSeason });
      return;
    }

    res.json({ season });
  } catch (error) {
    next(error);
  }
}

export async function getSeasonHistory(_req: any, res: Response, next: NextFunction) {
  try {
    const seasons = await Season.find().sort({ seasonNumber: -1 }).limit(20).lean();
    res.json({ seasons });
  } catch (error) {
    next(error);
  }
}
