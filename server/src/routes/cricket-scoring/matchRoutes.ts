/**
 * Cricket Scoring Feature — Phase 2
 * Routes for match management.
 * Mounted at /api/scoring/matches (via routes/index.ts)
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { isScorerOrCreator } from '../../middleware/isScorerOrCreator';
import {
  createMatch,
  listMatches,
  getMatch,
  updateScorers,
  startMatch,
  // Phase 5 additions (additive only):
  getBalls,
  getMatchStats,
} from '../../controllers/cricket-scoring/matchController';

const router = Router();

router.post('/', authenticate, createMatch);
router.get('/', authenticate, listMatches);
router.get('/:id', authenticate, getMatch);
router.patch('/:id/scorers', authenticate, updateScorers);          // only creator — checked inside controller
router.patch('/:id/start', authenticate, isScorerOrCreator, startMatch);
// Phase 5: read-only spectator endpoints (no isScorerOrCreator check — all authenticated users can read)
router.get('/:matchId/balls', authenticate, getBalls);
router.get('/:matchId/stats', authenticate, getMatchStats);

export default router;
