import express from 'express';
import { getAvailableSlots } from '../controllers/appointmentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/:doctorId/slots', getAvailableSlots);

export default router;
