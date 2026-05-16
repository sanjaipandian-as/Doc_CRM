import express from 'express';
import { getPatients, getPatientById, createPatient, updatePatient } from '../controllers/patientController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', createPatient);
router.patch('/:id', updatePatient);

export default router;
