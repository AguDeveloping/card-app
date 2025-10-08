import express from 'express';
import {
    getCards, getCardById, createCard, updateCard, deleteCard, getCardStats
} from '../controllers/cardController';
import { requireAuth } from '../config/auth';
import { requireAdmin } from '../middleware/authorization';

const router = express.Router();

// All card routes require authentication
router.use(requireAuth);

// Card routes
router.get('/', getCards);
router.get('/stat/', getCardStats); // static route must be before :id route
router.get('/:id', getCardById);    // dynamic route
router.post('/', createCard);
router.put('/:id', updateCard);

// Delete requires admin privileges
router.delete('/:id', requireAdmin, deleteCard);

export default router;
