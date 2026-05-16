import express from 'express';
import { login, getMe, registerAdmin } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', login);
router.post('/register-admin', registerAdmin);
router.get('/me', protect, getMe);

export default router;
