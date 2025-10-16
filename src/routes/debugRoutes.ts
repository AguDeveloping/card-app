import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { debugAuthMiddleware } from '../middleware/debug';
import { IUser } from '../models/User';

const router = Router();

// Authentication required for all routes
router.use(requireAuth);

// Admin access required for all routes
router.use(requireAdmin);

// TODO AR: comment this functions for production.
// Debug middleware AFTER authentication
router.use(debugAuthMiddleware); // This will show authenticated user info

// Route for testing user context
router.get('/whoami', (req: Request, res: Response) => {
    const user = req.user as IUser;
    res.json({
        message: 'Debug - Current User Info',
        authenticated: !!user,
        user: user ? {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        } : null,
        headers: {
            authorization: req.headers.authorization,
            'content-type': req.headers['content-type']
        },
        timestamp: new Date().toISOString()
    });
});
// Finish debug test route.

export default router;
