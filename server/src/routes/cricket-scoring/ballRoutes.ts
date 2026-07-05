/**
 * Cricket Scoring Feature — Phase 2
 * Routes for ball-by-ball scoring.
 * Mounted at /api/scoring/matches (via matchRoutes or routes/index.ts)
 * Full paths: POST /api/scoring/matches/:matchId/balls
 *             DELETE /api/scoring/matches/:matchId/balls/last
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { isScorerOrCreator } from '../../middleware/isScorerOrCreator';
import { recordBall, undoLastBall } from '../../controllers/cricket-scoring/ballController';

const router = Router({ mergeParams: true }); // mergeParams = inherit :matchId from parent

router.post('/', authenticate, isScorerOrCreator, recordBall);
router.delete('/last', authenticate, isScorerOrCreator, undoLastBall);

export default router;
