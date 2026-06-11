import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMatchHistory, getMatchHistoryByUser } from '../controllers/historyController';

const router = Router();

router.get('/', authenticate, getMatchHistory);
router.get('/user/:userId', authenticate, getMatchHistoryByUser);

export default router;
