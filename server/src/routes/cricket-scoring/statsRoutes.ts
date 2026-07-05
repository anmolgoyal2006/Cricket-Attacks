/**
 * Cricket Scoring Feature — Phase 2
 * Routes for player stats and scoring leaderboard.
 * Mounted at /api/scoring/stats (via routes/index.ts)
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getPlayerCareerStats,
  getPlayerMatchHistory,
  getScoringLeaderboard,
} from '../../controllers/cricket-scoring/statsController';

const router = Router();

router.get('/leaderboard', authenticate, getScoringLeaderboard);                // GET /api/scoring/stats/leaderboard?type=runs
router.get('/player/:playerId/career', authenticate, getPlayerCareerStats);     // GET /api/scoring/stats/player/:id/career
router.get('/player/:playerId/matches', authenticate, getPlayerMatchHistory);   // GET /api/scoring/stats/player/:id/matches

export default router;
