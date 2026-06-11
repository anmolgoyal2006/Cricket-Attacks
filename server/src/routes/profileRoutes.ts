import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProfile, getMyProfile } from '../controllers/profileController';

const router = Router();

router.get('/me', authenticate, getMyProfile);
router.get('/:id', authenticate, getProfile);

export default router;
