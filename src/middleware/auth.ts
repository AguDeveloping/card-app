import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
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
    // Find the user by ID from the JWT payload
    const user = await User.findById(payload.sub);

    if (!user) {
      //  logger.info('User not found with ID:', payload.sub);
      return done(null, false);
    }

    logger.info('User authenticated:', user.username);
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
  const authHeader = req.headers.authorization;
  logger.info('Headers:', req.headers);
  logger.info('=== === REQUIRE AUTH - START === ===');
  logger.info('Authorization:', req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'MISSING');

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // logger.info('Token decoded successfully:', JSON.stringify(decoded, null, 2));
      logger.info('Token decoded successfully:', decoded ? 'Valid token' : 'Invalid token');
    } catch (err: any) {
      logger.error('Token decode error: ', err.message);
    }
  }

  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    logger.info('=== PASSPORT AUTHENTICATE - START ===');
    logger.info('Error:', err || 'None');
    logger.info('User found:', user ? 'Yes' : 'No');

    if (err) {
      logger.error('Authentication error:', err.message);
      return res.status(500).json({ message: 'Internal server error during authentication' });
    }

    if (!user) {
      logger.info('Authentication failed:', info);
      return res.status(401).json({
        message: 'Authentication required',
        details: info ? info.message : 'Invalid or missing token'
      });
    }

    // Authentication successful - attach user to request
    logger.info('👤 User attached to request:', {
      id: user._id.toString(),
      username: user.username,
      role: user.role
    });
    logger.info('=== PASSPORT AUTHENTICATE - FINISH ===');
    logger.info('=== === REQUIRE AUTH - FINISH === ===');
    req.user = user;
    next();
  })(req, res, next);
};

// Initialize passport
export const initializePassport = (): void => {
  // The passport.initialize() function returns middleware that must be used in the app
  // We're just setting up the strategies here, the actual initialization happens in server.ts
};
