import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { getDailyWordle, submitWordleGuess } from '../controllers/wordleController';

const router = Router();

router.get('/daily', getDailyWordle);
router.post('/guess', optionalAuth, submitWordleGuess);

export default router;
