import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCollection, getCollectionStats, addToCollection } from '../controllers/collectionController';

const router = Router();

router.get('/', authenticate, getCollection);
router.get('/stats', authenticate, getCollectionStats);
router.post('/add', authenticate, addToCollection);

export default router;
