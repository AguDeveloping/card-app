import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import cardRoutes from './routes/cardRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import debugRoutes from './routes/debugRoutes';
import { loggerMiddleware, errorHandler } from './middleware/common';
import { connectToDatabase } from './config/database';
import { initializePassport } from './middleware/auth';
import { initializeAdminUser, initializeOwnerUser } from './controllers/authController';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Initialize Passport
initializePassport();
app.use(passport.initialize()); // This is critical for passport authentication to work.

// Connect to MongoDB
connectToDatabase().catch(err => {
  logger.error('Failed to connect to database:', err);
  process.exit(1);
});

// Initialize owner user
initializeOwnerUser().catch((err: any) => {
  logger.error('Failed to initialize owner user:', err);
});

// Initialize admin user
initializeAdminUser().catch((err: any) => {
  logger.error('Failed to initialize admin user:', err);
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Card App API is running',
    endpoints: {
      // Auth endpoints
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      profile: 'GET /api/auth/profile (requires authentication)',
      // Card endpoints
      getUserCards: 'GET /api/cards (requires authentication)',
      getCardStats: 'GET /api/cards/stat (requires authentication)',
      getCardById: 'GET /api/cards/:id (requires authentication)',
      createCard: 'POST /api/cards (requires authentication)',
      updateCard: 'PUT /api/cards/:id (requires authentication)',
      deleteCard: 'DELETE /api/cards/:id (requires admin)'
    }
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Card routes - require authentication
app.use('/api/cards', cardRoutes);

// Admin routes for testing and debugging - requires authentication
app.use('/api/admin', adminRoutes);

// Debug routes for testing and debugging - requires authentication
app.use('/api/debug', debugRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  logger.info(`API documentation available at http://localhost:${port}`);
});

export default app;
