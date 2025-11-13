console.log('=== STARTING IMPORT PROCESS... ===');
import logger from './utils/logger';
logger.info('=== Logger imported successfully ===');

import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
logger.info('=== Basic imports completed ===');

logger.debug('=== DEBUG: Routes importing... ===');
import cardRoutes from './routes/cardRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import debugRoutes from './routes/debugRoutes';
import infoRoutes from './routes/infoRoutes';
logger.info('=== Routes imported ===');

logger.debug('=== DEBUG: Database importing... ===');
import { startDatabaseAndInitialize } from './config/database';
logger.info('=== Database imported ===');

logger.debug('=== DEBUG: Middleware importing... ===');
import passport from 'passport';
import { initializePassport } from './middleware/auth';
import { loggerMiddleware, errorHandler } from './middleware/common';
logger.info('=== Passport imported ===');

logger.info('✅ All imports completed');

let app: Express | undefined = undefined;

try {
  logger.info('=== APPLICATION STARTING ===');

  // Clean environment variable loading
  if (process.env.NODE_ENV !== 'production') {
    try {
      dotenv.config({ path: '.env' });
      dotenv.config({ path: '.env.local', override: true });
      logger.info('Development: Environment variables loaded from .env files');
    } catch (error) {
      logger.warn('Development: No .env files found, using system environment variables');
    }
  } else {
    logger.info('Production mode: using Railway environment variables');
  }
  logger.info('=== Environment loading completed ===');

  // Validate required environment variables
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }

  logger.info('Environment validation passed');
  logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
  logger.info(`PORT: ${process.env.PORT}`);
  logger.info(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);
  logger.info(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);

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

  // Create Express app
  app = express();

  logger.info('=== SETTING UP BASIC MIDDLEWARE ===');

  // CORS configuration
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:4000',
      /^https:\/\/agudeveloping\.github\.io(\/.*)?$/,
      /https:\/\/.*\.railway\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(loggerMiddleware);

  logger.info('Basic middleware configured');

  // Initialize Passport
  logger.info('Initializing Passport...');
  initializePassport();
  app.use(passport.initialize());
  logger.info('Passport initialized');

  logger.info('Routes setup starting...');

  // Info routes
  app.use('', infoRoutes);

  // Auth routes
  app.use(`${API_PATH}/auth`, authRoutes);

  // Card routes - require authentication
  app.use(`${API_PATH}/cards`, cardRoutes);

  // Admin routes for testing and debugging - requires authentication
  app.use(`${API_PATH}/admin`, adminRoutes);

  // Debug routes for testing and debugging - requires authentication
  app.use(`${API_PATH}/debug`, debugRoutes);

  logger.debug('=== DEBUG: Middleware and routes setup completed ===');

  // Start database connection and wait for it
  startDatabaseAndInitialize().catch((err: any) => {
    logger.error('Failed to start database and initialize users:', err.message);
    process.exit(1);
  });

  // Ensure app is defined
  if (!app) {
    logger.error('❌ Express app is not initialized');
    process.exit(1);
  }

  // Error handling middleware
  app.use(errorHandler);

  // Start server
  logger.info('=== STARTING SERVER ===');
  const server = app.listen(PORT, IP, () => {
    logger.info(`✅ Server successfully started!`);
    logger.info(`🚀 Server is running on ${baseUrl}`);
    logger.info(`🏥 Health check available at ${baseUrl}/health`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
    logger.info('=== SERVER READY ===');
  });

  // Handle server errors, events, and graceful shutdown
  server.on('error', (error: any) => {
    logger.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
    }
    process.exit(1);
  });
  server.on('close', () => {
    logger.info('Server is closing');
  });
  server.on('listening', () => {
    logger.info('Server is listening for connections');
  });
  server.on('connection', (socket: any) => {
    logger.info('New connection established: ', {
      socketId: socket.id,
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort,
      socketIpAddress: socket.ipAddress,
      socketFamily: socket.family
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

} catch (error) {
  logger.error('❌ Application startup error:', error);
  process.exit(1);
}

export default app;