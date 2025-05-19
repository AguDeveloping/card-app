import express from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { requireAuth } from '../config/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', requireAuth, getProfile);

export default router;
