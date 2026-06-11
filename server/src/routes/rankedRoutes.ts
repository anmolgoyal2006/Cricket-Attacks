import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { completeRankedBattle } from '../controllers/rankedController';

const router = Router();

router.post('/complete', authenticate, completeRankedBattle);

export default router;
