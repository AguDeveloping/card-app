import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', requireAuth, getProfile);

export default router;
