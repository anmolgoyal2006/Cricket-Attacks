import { Router } from 'express';
import { getCurrentSeason, getSeasonHistory } from '../controllers/seasonController';

const router = Router();

router.get('/current', getCurrentSeason);
router.get('/history', getSeasonHistory);

export default router;
