import { Router } from 'express';
import cricbuzzService from '../services/cricbuzz.service';

const router = Router();

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
    console.error('Error in live matches route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live matches',
      error: error instanceof Error ? error.message : 'Unknown error',
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
    console.error('Error in upcoming matches route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming matches',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
