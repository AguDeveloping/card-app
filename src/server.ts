import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import cardRoutes from './routes/cardRoutes';
import authRoutes from './routes/authRoutes';
import { loggerMiddleware, errorHandler } from './middleware/common';
import { debugAuthMiddleware } from './middleware/debug';
import { connectToDatabase } from './config/database';
import { initializePassport } from './config/auth';
import { initializeAdminUser } from './controllers/authController';

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
app.use(debugAuthMiddleware); // Add debug middleware to log auth headers

// Initialize Passport
initializePassport();
app.use(passport.initialize()); // This is critical for passport authentication to work

// Connect to MongoDB
connectToDatabase().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Initialize admin user
initializeAdminUser().catch(err => {
  console.error('Failed to initialize admin user:', err);
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
      getAllCards: 'GET /api/cards (requires authentication)',
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

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API documentation available at http://localhost:${port}`);
});

export default app;
