import express from 'express';
import {
    getDoctors, createDoctor, updateDoctor,
    getReceptionists, createReceptionist,
    getAppointmentTypes, createAppointmentType,
    getSchedules, createSchedule,
    getLeaves, createLeave,
    getAuditLogs,
    createBulkSchedule,
    deleteSchedule,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect);

router.get('/doctors', authorize(UserRole.ADMIN, UserRole.RECEPTIONIST), getDoctors);
router.post('/doctors', authorize(UserRole.ADMIN), createDoctor);
router.patch('/doctors/:id', authorize(UserRole.ADMIN), updateDoctor);

router.get('/receptionists', authorize(UserRole.ADMIN), getReceptionists);
router.post('/receptionists', authorize(UserRole.ADMIN), createReceptionist);

router.get('/appointment-types', authorize(UserRole.ADMIN, UserRole.RECEPTIONIST), getAppointmentTypes);
router.post('/appointment-types', authorize(UserRole.ADMIN), createAppointmentType);

router.get('/schedules', authorize(UserRole.ADMIN, UserRole.RECEPTIONIST), getSchedules);
router.post('/schedules', authorize(UserRole.ADMIN), createSchedule);
router.post('/schedules/bulk', protect, authorize(UserRole.ADMIN), createBulkSchedule);
router.delete('/schedules/:id', protect, authorize(UserRole.ADMIN), deleteSchedule); // <--- Add this

router.get('/leaves', authorize(UserRole.ADMIN, UserRole.RECEPTIONIST), getLeaves);
router.post('/leaves', authorize(UserRole.ADMIN), createLeave);

router.get('/audit-logs', authorize(UserRole.ADMIN), getAuditLogs);

export default router;