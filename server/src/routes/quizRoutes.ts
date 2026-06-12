import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { getQuizQuestions, submitQuizAnswer } from '../controllers/quizController';

const router = Router();

router.get('/questions', getQuizQuestions);
router.post('/answer', optionalAuth, submitQuizAnswer);

export default router;
