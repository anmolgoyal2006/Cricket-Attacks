import { Router } from 'express';
import { register, login, getMe, claimCoins } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { registerSchema, loginSchema } from '../utils/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.post('/claim-coins', authenticate, claimCoins);

export default router;
