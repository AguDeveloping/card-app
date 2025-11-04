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

logger.info('=== APPLICATION STARTING ===');

// Load environment variables
dotenv.config({ path: '.env' }); // Load base config first
dotenv.config({ path: '.env.local', override: true }); // Load local overrides

logger.info('Environment variables loaded');
logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`PORT: ${process.env.PORT}`);
logger.info(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);

// Create Express app
const app: Express = express();

// API configuration from environment variables
const PROTOCOL = process.env.PROTOCOL || 'http';
const IP = process.env.IP || '0.0.0.0';
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const API_PATH = process.env.API_PATH || '/api';
const baseUrl = `${PROTOCOL}://${IP}:${PORT}`;
const apiUrl = `${baseUrl}${API_PATH}`;

logger.info('API Configuration:', {
  protocol: PROTOCOL,
  ip: IP,
  port: PORT,
  apiPath: API_PATH,
  apiUrl: apiUrl
});

logger.info('=== SETTING UP MIDDLEWARE ===');
// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

logger.info('Middleware configured');

// Initialize Passport
logger.info('Initializing Passport...');
initializePassport();
app.use(passport.initialize()); // This is critical for passport authentication to work.

// Connect to MongoDB
logger.info('=== CONNECTING TO DATABASE ===');
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
logger.info('=== SETTING UP ROUTES ===');

// Add health check endpoint
app.get('/health', (req: Request, res: Response) => {
  logger.info('Health check endpoint called');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Card App Server is running',
  });
});

app.get(`${API_PATH}`, (req: Request, res: Response) => {
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
app.use(`${API_PATH}/auth`, authRoutes);

// Card routes - require authentication
app.use(`${API_PATH}/cards`, cardRoutes);

// Admin routes for testing and debugging - requires authentication
app.use(`${API_PATH}/admin`, adminRoutes);

// Debug routes for testing and debugging - requires authentication
app.use(`${API_PATH}/debug`, debugRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server - BIND TO 0.0.0.0 to accept external connections
logger.info('=== STARTING SERVER ===');
const server = app.listen(PORT, IP, () => {
  logger.info(`✅ Server successfully started!`);
  logger.info(`🚀 Server is running on http://${IP}:${PORT}`);
  logger.info(`🌐 API documentation available at ${apiUrl}`);
  logger.info(`🏥 Health check available at http://${IP}:${PORT}/health`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info('=== SERVER READY ===');
});

// Handle server errors
server.on('error', (error: any) => {
  logger.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;