import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { generateToken } from '../middleware/auth';
import passport from 'passport';
import logger from '../utils/logger';

import jwt from 'jsonwebtoken';

// Use a consistent JWT secret across the application
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const takeAndVerifyToken = (res: Response, userDB: IUser): string | Response | undefined => {
  // Generate JWT token and verify it
  let token: string | undefined = undefined;
  try {
    token = generateToken(userDB._id.toString());
    if (!token) {
      logger.error('❌ Token generation failed');
      return res.status(500).json({ message: 'Error generating token' });
    }
    // logger.info('✅ Generated token: ', token ? `${token.substring(0, 20)}...` : 'No token');
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      logger.info('❌ Token verification failed: No decoded payload');
      return res.status(500).json({ message: 'Token verification failed' });
    }
    // logger.info('✅ Token verified successfully');
  } catch (err: any) {
    logger.error('❌ Token verification failed:', err.message);
    return res.status(500).json({ message: 'Error during token verification', error: err.message });
  }
  return token;
};

// Register a new user
export const register = async (req: Request, res: Response): Promise<Response | void> => {
  logger.info('=== 🔍 Passport Strategy - register - START ===');
  try {
    const { username, email, password, role } = req.body;
    // Input validation
    if (!username || !email || !password) {
      logger.info('❌ Registration failed: Missing required fields');
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.info('❌ Registration failed: Invalid email format');
      return res.status(400).json({ message: 'Invalid email format' });
    }
    // Password length validation
    if (password.length < 6) {
      logger.info('❌ Registration failed: Password must be at least 6 characters long');
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      logger.info('❌ Registration failed: User already exists with', field);
      return res.status(400).json({ message: `${field} already exists` });
    }
    // Only allow certain roles during registration
    const allowedRoles = ['admin', 'user', 'editor', 'reader'];
    if (!role || !allowedRoles.includes(role)) {
      logger.info('❌ Registration failed: Invalid role specified');
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    const userRole = role && allowedRoles.includes(role) ? role : 'admin';
    // Create new user
    const user: IUser = new User({
      username,
      email,
      password,
      role: userRole    // Use validated role
    });
    // Save user to database
    const savedUser: IUser | undefined = await user.save();
    if (!savedUser) {
      logger.error('❌ Error saving new user to the database');
      return res.status(500).json({ message: 'Error registering user' });
    }
    logger.info('✅ New user registered:', {
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role
    });
    // Generate JWT token and verify it
    const token = takeAndVerifyToken(res, savedUser);
    if (!token || typeof token !== 'string') {
      return;
    }
    logger.info('=== 🔍 Passport Strategy - register - FINISH ===');
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    logger.error('Registration error:', error.message);
    return res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<Response | void> => {
  // Use passport's local strategy to authenticate
  passport.authenticate('local', { session: false }, (err: any, user: IUser, info: any) => {
    // logger.info('=== 🔍 Passport Strategy - login - START ===');
    if (err) {
      logger.error('❌ Login error:', err);
      return res.status(500).json({ message: 'Error during authentication', error: err });
    }
    if (!user) {
      logger.info('❌ Login failed:', info?.message || 'Invalid credentials');
      return res.status(401).json({ message: info?.message || 'Invalid credentials' });
    }
    // Generate JWT token
    const token = takeAndVerifyToken(res, user);
    if (!token || typeof token !== 'string') {
      return;
    }
    // logger.info('=== 🔍 Passport Strategy - login - FINISH ===');
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  })(req, res);
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
  } catch (error: any) {
    logger.error('❌ Error fetching profile:', error.message);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
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
      logger.info('✅ Default admin user created');
    }
  } catch (error: any) {
    logger.error('❌ Error initializing admin user:', error.message);
  }
};

// Initialize owner user if it doesn't exist
export const initializeOwnerUser = async (): Promise<void> => {
  try {
    // Check if owner user already exists
    const ownerExists = await User.findOne({ username: 'owner' }) as IUser;
    // Longer password to meet minimum length requirement
    const password = process.env.API_PASSWORD_OWNER || 'owner123';

    if (!ownerExists) {
      // Create default owner user
      const ownerUser = new User({
        username: 'owner',
        email: 'owner@example.com',
        password,
        role: 'owner'
      });

      await ownerUser.save();
      logger.info('✅ Default owner user created');
    }
  } catch (error: any) {
    logger.error('❌ Error initializing owner user:', error.message);
  }
};
