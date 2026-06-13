import { Router, Request, Response } from 'express';
import Player from '../models/Player';

const router = Router();

/**
 * GET /api/cricbuzz/test
 */
router.get('/test', (_req, res) => {
  res.json({ success: true, message: 'Cricbuzz routes working' });
});

/**
 * GET /api/cricbuzz/players/search?name=query
 * Search players by name from our own Player collection.
 */
router.get('/players/search', async (req: Request, res: Response) => {
  try {
    const name = (req.query.name as string || '').trim();

    if (name.length < 2) {
      res.status(400).json({ error: 'Query too short' });
      return;
    }

    const players = await Player.find(
      { name: { $regex: name, $options: 'i' } },
      { _id: 1, name: 1, image: 1, country: 1, role: 1 }
    )
      .sort({ overall: -1 })
      .limit(20)
      .lean();

    const data = players.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.name.toLowerCase().replace(/\s+/g, '-'),
      image: p.image || '',
    }));

    res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in player search route:', message);
    res.status(500).json({ error: message });
  }
});

export default router;
