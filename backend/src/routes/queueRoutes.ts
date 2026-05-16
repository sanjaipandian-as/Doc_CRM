import express from 'express';
import { getQueue, addToQueue, reorderQueue, updateQueueStatus, syncQueue } from '../controllers/queueController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getQueue);
router.post('/add', addToQueue);
router.patch('/reorder', reorderQueue);
router.patch('/:id/status', updateQueueStatus);
router.post('/sync', syncQueue);

export default router;
