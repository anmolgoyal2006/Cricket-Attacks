import { Router } from 'express';
import cricbuzzService from '../services/cricbuzz.service';

const router = Router();

/**
 * GET /api/cricbuzz/test
 * Health check for Cricbuzz routes
 */
router.get('/test', (_req, res) => {
  res.json({ success: true, message: 'Cricbuzz routes working' });
});

/**
 * GET /api/cricbuzz/players/search
 * Search players by name using Cricbuzz API
 */
router.get('/players/search', async (req, res) => {
  try {
    const name = (req.query.name as string || '').trim();

    if (name.length < 2) {
      res.status(400).json({ error: 'Query too short' });
      return;
    }

    const players = await cricbuzzService.searchPlayers(name);
    res.json({ success: true, data: players });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in player search route:', message);
    res.status(500).json({ error: message });
  }
});

export default router;
