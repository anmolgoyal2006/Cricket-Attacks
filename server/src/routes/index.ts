import { Router } from 'express';
import authRoutes from './authRoutes';
import playerRoutes from './playerRoutes';
import collectionRoutes from './collectionRoutes';
import packRoutes from './packRoutes';
import battleRoutes from './battleRoutes';
import leaderboardRoutes from './leaderboardRoutes';
import cricbuzzRoutes from './cricbuzzRoutes';
import rankedRoutes from './rankedRoutes';
import profileRoutes from './profileRoutes';
import historyRoutes from './historyRoutes';
import seasonRoutes from './seasonRoutes';
import wordleRoutes from './wordleRoutes';
import quizRoutes from './quizRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cards', playerRoutes);
router.use('/user-cards', collectionRoutes);
router.use('/packs', packRoutes);
router.use('/battles', battleRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/cricbuzz', cricbuzzRoutes);
router.use('/ranked', rankedRoutes);
router.use('/profile', profileRoutes);
router.use('/history', historyRoutes);
router.use('/seasons', seasonRoutes);
router.use('/wordle', wordleRoutes);
router.use('/quiz', quizRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
