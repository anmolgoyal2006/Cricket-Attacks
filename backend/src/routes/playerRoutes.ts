import { Router } from 'express';
import { getAllPlayers, getPlayerById } from '../controllers/playerController';

const router = Router();

router.get('/', getAllPlayers);
router.get('/:id', getPlayerById);

export default router;
