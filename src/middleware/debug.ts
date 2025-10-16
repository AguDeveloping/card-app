import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import logger from '../utils/logger';

// Debug middleware to log authentication headers and user info
export const debugAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  logger.info('>>> >>> DEBUG AUTH MIDDLEWARE - START <<< <<<');
  logger.info('Authorization:', req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'MISSING');

  // Add user information if available
  if (req.user) {
    const user = req.user as IUser;
    logger.info('User Info:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } else {
    logger.info('User: Not authenticated');
  }

  // ✅ Safe stringification
  logger.info('Route:', JSON.stringify(req.route || {}, null, 2));
  logger.info('Query:', JSON.stringify(req.query || {}, null, 2));
  logger.info('Body:', JSON.stringify(req.body || {}, null, 2));
  logger.info('>>> >>> DEBUG AUTH MIDDLEWARE - FINISH <<< <<<');
  next();
};
