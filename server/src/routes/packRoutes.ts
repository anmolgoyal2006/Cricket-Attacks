import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getPackInfo, openPackHandler, getPackHistory } from '../controllers/packController';
import { validate } from '../utils/validation';
import { openPackSchema } from '../utils/validation';
import { packLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', getPackInfo);
router.post('/open', authenticate, packLimiter, validate(openPackSchema), openPackHandler);
router.get('/history', authenticate, getPackHistory);

export default router;
