import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { isDatabaseConnected } from '../config/database';

// Simple logging middleware
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

// Error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
};

// Middleware to ensure database connection
export const requireDatabase = (req: Request, res: Response, next: NextFunction) => {
  if (!isDatabaseConnected()) {
    logger.warn(`Database connection required for ${req.method} ${req.path} - rejecting request`);
    return res.status(503).json({
      message: 'Service temporarily unavailable - database connection required',
      error: 'Database not connected',
      timestamp: new Date().toISOString()
    });
  }
  next();
};