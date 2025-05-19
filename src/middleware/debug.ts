import { Request, Response, NextFunction } from 'express';

// Debug middleware to log authentication headers
export const debugAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  console.log('\n--- DEBUG AUTH ---');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Authorization:', req.headers.authorization);
  console.log('----------------\n');
  next();
};
