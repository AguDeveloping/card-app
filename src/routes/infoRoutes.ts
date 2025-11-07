import { Request, Response, Router } from 'express';
import logger from '../utils/logger';
import mongoose from 'mongoose';

const PORT: number = parseInt(process.env.PORT || '3000', 10);
const API_PATH = process.env.API_PATH || '/api';

const router = Router();

// Root endpoint
router.get('/', (req: Request, res: Response) => {
    logger.info('Root endpoint accessed');
    res.status(200).json({
        message: 'Card App Server is running',
        environment: process.env.NODE_ENV,
        port: PORT,
        status: 'operational'
    });
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
    logger.info('Health check accessed');
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

// Endpoint to verify DB status and connectivity
router.get('/debug/db', (req: Request, res: Response) => {
    const dbStatus = mongoose.connection.readyState;
    const statusNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.status(200).json({
        database: {
            status: statusNames[dbStatus] || 'unknown',
            readyState: dbStatus,
            host: mongoose.connection.host,
            name: mongoose.connection.name,
            mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
        }
    });
});

// API info endpoint
router.get(`${API_PATH}`, (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Card App API is running',
        endpoints: {
            login: 'POST /api/auth/login',
            register: 'POST /api/auth/register',
            profile: 'GET /api/auth/profile (requires authentication)',
            getUserCards: 'GET /api/cards (requires authentication)',
            getCardStats: 'GET /api/cards/stat (requires authentication)',
            getCardById: 'GET /api/cards/:id (requires authentication)',
            createCard: 'POST /api/cards (requires authentication)',
            updateCard: 'PUT /api/cards/:id (requires authentication)',
            deleteCard: 'DELETE /api/cards/:id (requires admin)'
        }
    });
});

export default router;