import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import logger from '../utils/logger';

// Use a consistent JWT secret across the application
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT options
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

// JWT strategy for protecting routes
passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    //logger.info('JWT Payload received:', payload);
    
    // Find the user by ID from the JWT payload
    const user = await User.findById(payload.sub);
    
    if (!user) {
      //  logger.info('User not found with ID:', payload.sub);
      return done(null, false);
    }

    //logger.info('User authenticated:', user.username);
    return done(null, user);
  } catch (error) {
    logger.error('JWT Authentication Error:', error);
    return done(error, false);
  }
}));

// Local strategy for username/password login
passport.use(new LocalStrategy(
  { usernameField: 'username' },
  async (username, password, done) => {
    try {
      // Find the user by username
      const user = await User.findOne({ username });
      
      // If user not found or password doesn't match
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }
      
      // Check if password matches
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Generate JWT token
export const generateToken = (userId: string): string => {
  const payload = {
    sub: userId,
    // Don't manually set iat (issued at) - JWT library does this automatically
  };
  
  // Log token generation (but not the secret)
  logger.info('Generating token for user ID:', userId);
  //logger.info('Token payload:', payload);

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  logger.info('Token generated successfully');

  return token;
};

// Authentication middleware with custom error handling
export const requireAuth = (req: any, res: any, next: any) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    // logger.info('Authentication attempt:', { err, user: user ? 'User found' : 'No user', info });
    
    if (err) {
      // logger.error('Authentication error:', err);
      return res.status(500).json({ message: 'Internal server error during authentication' });
    }
    
    if (!user) {
      // Authentication failed - token invalid or missing
      logger.info('Authentication failed:', info);
      return res.status(401).json({ 
        message: 'Authentication required', 
        details: info ? info.message : 'Invalid or missing token'
      });
    }
    
    // Authentication successful - attach user to request
    req.user = user;
    next();
  })(req, res, next);
};

// Initialize passport
export const initializePassport = (): void => {
  // The passport.initialize() function returns middleware that must be used in the app
  // We're just setting up the strategies here, the actual initialization happens in server.ts
};
