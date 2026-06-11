import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { startPvE, playRoundHandler, getBattleById, getBattleHistory } from '../controllers/battleController';
import { validate } from '../utils/validation';
import { startBattleSchema, playRoundSchema } from '../utils/validation';

const router = Router();

router.post('/pve', authenticate, validate(startBattleSchema), startPvE);
router.post('/:battleId/round', authenticate, validate(playRoundSchema), playRoundHandler);
router.get('/', authenticate, getBattleHistory);
router.get('/:id', authenticate, getBattleById);

export default router;
