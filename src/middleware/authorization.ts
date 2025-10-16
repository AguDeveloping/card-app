import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import logger from '../utils/logger';

// Owner role access control middleware
export const requireOwner = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as IUser;

  if (!user) {
    res.status(401).json({ message: 'Unauthorized - No user found' });
    return;
  }

  if (user.role !== 'owner') {
    res.status(403).json({ message: 'Forbidden - Owner access required' });
    return;
  }

  next();
};

// Admin role access control middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as IUser;

  if (!user) {
    res.status(401).json({ message: 'Unauthorized - No user found' });
    return;
  }

  if (user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden - Admin access required' });
    return;
  }

  next();
};

// Helper to check if user owns resource or is admin
export const checkOwnership = (resourceUserId: string, currentUser: IUser): boolean => {
  // return currentUser.role === 'admin' || currentUser._id.toString() === resourceUserId.toString();
  const hasOwnership = (
    // currentUser.role === 'admin' ||
    currentUser._id.toString() === resourceUserId.toString()
  );
  // TODO AR comment this line for production
  logger.info('=== OWNERSHIP CHECK ===');
  logger.info('Card belongs to user ID:', resourceUserId.toString());
  logger.info('Current user ID:', currentUser._id.toString());
  logger.info('Current user role:', currentUser.role);
  logger.info('Ownership check result:', hasOwnership);
  // Finish the debugging logs
  return hasOwnership;
};
