import { Router } from 'express';
import cricbuzzService from '../services/cricbuzz.service';

console.log('Cricbuzz routes loaded');

const router = Router();

/**
 * GET /api/cricbuzz/test
 * Health check for Cricbuzz routes
 */
router.get('/test', (_req, res) => {
  res.json({ success: true, message: 'Cricbuzz routes working' });
});

/**
 * GET /api/cricbuzz/live
 * Fetch live cricket matches from Cricbuzz API
 * Returns cached data if available (60 second cache)
 */
router.get('/live', async (req, res) => {
  try {
    const result = await cricbuzzService.fetchLiveMatches();
    
    res.status(200).json({
      success: true,
      data: result.matches,
      cached: result.cached,
      timestamp: result.timestamp,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in live matches route:', message);
    res.status(500).json({
      success: false,
      message,
      data: [],
      cached: false,
      timestamp: Date.now(),
    });
  }
});

/**
 * GET /api/cricbuzz/upcoming
 * Fetch upcoming cricket matches from Cricbuzz API
 * Returns cached data if available (60 second cache)
 */
router.get('/upcoming', async (req, res) => {
  try {
    const result = await cricbuzzService.fetchUpcomingMatches();
    
    res.status(200).json({
      success: true,
      data: result.matches,
      cached: result.cached,
      timestamp: result.timestamp,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in upcoming matches route:', message);
    res.status(500).json({
      success: false,
      message,
      data: [],
      cached: false,
      timestamp: Date.now(),
    });
  }
});

export default router;
