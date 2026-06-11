import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getLeaderboardHandler, getMyRankHandler } from '../controllers/leaderboardController';

const router = Router();

router.get('/', getLeaderboardHandler);
router.get('/my-rank', authenticate, getMyRankHandler);

export default router;
