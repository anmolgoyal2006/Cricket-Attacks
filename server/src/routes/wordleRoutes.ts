import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import {
  getDailyWordle,
  submitWordleGuess,
  getDailyFaceReveal,
  submitFaceRevealGuess,
} from '../controllers/wordleController';

const router = Router();

router.get('/daily', getDailyWordle);
router.post('/guess', optionalAuth, submitWordleGuess);
router.get('/face-reveal', getDailyFaceReveal);
router.post('/face-reveal/guess', optionalAuth, submitFaceRevealGuess);

export default router;
