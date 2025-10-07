import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Debug middleware to log authentication headers
export const debugAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // logger.info('\n--- DEBUG AUTH ---');
  // logger.info('Headers:', JSON.stringify(req.headers, null, 2));
  // logger.info('Authorization:', req.headers.authorization);
  // logger.info('----------------\n');
  next();
};
