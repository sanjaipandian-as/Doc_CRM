import express from 'express';
import {
    getAppointments, createAppointment, rescheduleAppointment,
    cancelAppointment, updateAppointmentStatus
} from '../controllers/appointmentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.patch('/:id/reschedule', rescheduleAppointment);
router.patch('/:id/cancel', cancelAppointment);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
