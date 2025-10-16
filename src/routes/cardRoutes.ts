import { Router } from 'express';
import { requireAdmin } from '../middleware/authorization';
import { requireAuth } from '../middleware/auth';
import {
    createCard,
    getUserCards, getCardById,
    updateCard, deleteCard,
    getCardStats
} from '../controllers/cardController';

const router = Router();

// Authentication required for all routes
router.use(requireAuth);

// Card routes
router.get('/', getUserCards); // user's own cards
router.get('/stat/', getCardStats); // static route must be before :id route
router.get('/:id', getCardById);    // dynamic route

router.post('/', createCard);

router.put('/:id', updateCard);

// Delete requires admin privileges
router.delete('/:id', requireAdmin, deleteCard);

export default router;
