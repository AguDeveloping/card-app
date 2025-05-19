import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

// Role-based authorization middleware
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // User should be attached to request by passport middleware
    const user = req.user as IUser;
    
    if (!user) {
      res.status(401).json({ message: 'Unauthorized - No user found' });
      return;
    }
    
    if (user.role !== role && user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
      return;
    }
    
    next();
  };
};

// Admin only middleware
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
