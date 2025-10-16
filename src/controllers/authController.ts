import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { generateToken } from '../middleware/auth';
import logger from '../utils/logger';

import jwt from 'jsonwebtoken';

// Use a consistent JWT secret across the application
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';


// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Create new user
    const user: IUser = new User({
      username,
      email,
      password,
      role: role || 'user' // Default to 'user' if role not provided
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username }) as IUser;
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    // TODO AR - to debugging decoded token
    // Add debugging
    logger.info('=== LOGIN DEBUG - START ===');
    logger.info('User ID:', user._id.toString());
    logger.info('Generated token:', token ? `${token.substring(0, 20)}...` : 'No token');

    // Verify the token we just created
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      logger.info('Token verification:', decoded ? 'Token is valid' : 'Token is invalid');
    } catch (err) {
      logger.error('Token verification failed:', err);
    }
    logger.info('=== LOGIN DEBUG - FINISH ===');
    // End debugging

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is attached to request by passport middleware
    const user = req.user as IUser;

    res.status(200).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};

// Initialize admin user if it doesn't exist
export const initializeAdminUser = async (): Promise<void> => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ username: 'admin' }) as IUser;

    if (!adminExists) {
      // Create default admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123', // Longer password to meet minimum length requirement
        role: 'admin'
      });

      await adminUser.save();
      logger.info('Default admin user created');
    }
  } catch (error) {
    logger.error('Error initializing admin user:', error);
  }
};

// Initialize owner user if it doesn't exist
export const initializeOwnerUser = async (): Promise<void> => {
  try {
    // Check if owner user already exists
    const ownerExists = await User.findOne({ username: 'owner' }) as IUser;

    if (!ownerExists) {
      // Create default owner user
      const ownerUser = new User({
        username: 'owner',
        email: 'owner@example.com',
        password: 'owner123', // Longer password to meet minimum length requirement
        role: 'owner'
      });

      await ownerUser.save();
      logger.info('Default owner user created');
    }
  } catch (error) {
    logger.error('Error initializing owner user:', error);
  }
};
