import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireOwner } from '../middleware/authorization';
import { getAllCards } from '../controllers/adminController';
import logger from '../utils/logger';

const router = Router();

// Authentication required for all routes
router.use(requireAuth);

// Admin access required for all routes
router.use(requireOwner);

// Admin routes
router.get('/all', getAllCards); // GET /api/admin/all - all cards (admin only)

router.get('/log-level', (req: Request, res: Response) => {
    res.json({
        currentLevel: logger.level,
        availableLevels: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']
    });
});

router.post('/log-level', (req: Request, res: Response): any => {
    const { level } = req.body;
    const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];

    if (!validLevels.includes(level)) {
        return res.status(400).json({
            message: 'Invalid log level',
            validLevels
        });
    }

    logger.setLogLevel(level);
    res.json({
        message: `Log level changed to ${level}`,
        currentLevel: logger.level
    });
});

export default router;
