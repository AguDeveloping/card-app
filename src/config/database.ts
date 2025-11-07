import mongoose from 'mongoose';
import logger from '../utils/logger';
import { Express } from 'express';
import { initializeAdminUser, initializeOwnerUser } from '../controllers/authController';

// Database configuration from environment variables
const DB_CONFIG = {
  // Main database name for the application. Set to default 'card-app'.
  name: 'card-app',
  // Auth source from environment or default
  authSource: process.env.MONGODB_AUTHSOURCE || 'admin',
  // Connection options for Railway/Production
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    connectTimeoutMS: 15000,
    bufferCommands: true,  // Enable buffering to queue operations before connection
    // bufferMaxEntries: 0,
    retryWrites: true,
    w: 'majority' as const
  }
};

// Build MongoDB URI from environment variables
const buildMongoUri = (): string => {
  // Option 1: Use complete MONGO_URL from MongoDB service
  if (process.env.MONGODB_URI) {
    const baseUri = process.env.MONGODB_URI.replace(/\/$/, ''); // Remove trailing slash
    let completeUri = `${baseUri}/${DB_CONFIG.name}`;

    // Add auth source if specified
    if (DB_CONFIG.authSource) {
      const separator = completeUri.includes('?') ? '&' : '?';
      completeUri += `${separator}authSource=${DB_CONFIG.authSource}`;
    }
    return completeUri;
  }

  // Option 2: Build URI from individual components (fallback)
  const host = process.env.MONGODB_HOST || 'localhost';
  const port = process.env.MONGODB_PORT || '27017';
  const user = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;

  if (!user || !password) {
    throw new Error('MongoDB credentials not found in environment variables');
  }

  let uri = `mongodb://${user}:${password}@${host}:${port}/${DB_CONFIG.name}`;

  if (DB_CONFIG.authSource) {
    uri += `?authSource=${DB_CONFIG.authSource}`;
  }

  return uri;
};


// Connect to MongoDB
export const connectToDatabase = async (): Promise<void> => {
  try {
    logger.info('=== CONNECTING TO DATABASE ===');

    // Build complete MongoDB URI
    const mongoUri = buildMongoUri();

    // Log connection details (hide credentials)
    const sanitizedUri = mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://[USERNAME]:[PASSWORD]@');
    logger.info(`MongoDB URI: ${sanitizedUri}`);
    logger.info(`Database name: ${DB_CONFIG.name}`);
    logger.info(`Auth source: ${DB_CONFIG.authSource}`);

    // Log environment variable sources
    logger.info('Environment variable sources:');
    logger.info(`- MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);
    logger.info(`- MONGODB_AUTHSOURCE: ${process.env.MONGODB_AUTHSOURCE || 'using default'}`);

    // Set mongoose options
    mongoose.set('strictQuery', false);

    // Connect with complete URI and options
    await mongoose.connect(mongoUri, DB_CONFIG.options);

    logger.info('✅ Connected to MongoDB successfully');
    logger.info(`Connected database: ${mongoose.connection.name}`);
    logger.info(`Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    logger.info(`Ready state: ${mongoose.connection.readyState} (1 = connected)`);

    // Test the connection with a ping
    try {
      const adminDb: any = mongoose.connection.db!.admin();
      const pingResult = await adminDb.ping();
      logger.info('✅ MongoDB ping successful:', pingResult);
    } catch (pingError: any) {
      logger.warn('MongoDB ping failed (may be permissions limited):', pingError.message);
    }

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', {
        name: error.name,
        message: error.message
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('❌ MongoDB connection failed:');

    if (error instanceof Error) {
      logger.error(`Error name: ${error.name}`);
      logger.error(`Error message: ${error.message}`);

      // Specific error handling with solutions
      if (error.name === 'MongooseServerSelectionError') {
        logger.error('🔍 Server selection failed');
        logger.error('💡 Check: MongoDB service is running, network connectivity');
      } else if (error.name === 'MongoParseError') {
        logger.error('🔍 URI parsing failed');
        logger.error('💡 Check: MONGODB_URI format and environment variables');
      } else if (error.message.includes('Authentication failed')) {
        logger.error('🔍 Authentication failed');
        logger.error('💡 Check: MONGODB_USER, MONGODB_PASSWORD, MONGODB_AUTHSOURCE');
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.error(`Error stack: ${error.stack}`);
      }
    }

    // In production, don't exit - let the app run without database
    if (process.env.NODE_ENV === 'production') {
      logger.error('🚨 Running in production mode without database connection');
      logger.error('🔄 The application will continue but database operations will fail');
      return;
    } else {
      throw error;
    }
  }
};

// Get database configuration
export const getDatabaseConfig = () => ({
  ...DB_CONFIG,
  mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
});

// Disconnect from MongoDB
export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};

// Check if database is connected
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Get database connection status
export const getDatabaseStatus = (): string => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};

// Initialize database and default users for server startup
export const startDatabaseAndInitialize = async () => {
  try {
    logger.info('=== CONNECTING TO DATABASE ===');
    await connectToDatabase().catch((err: any) => {
      logger.error('Database connection failed:', err.message);
      process.exit(1);
    });
    logger.info('✅ Connected to MongoDB successfully');

    // Only initialize users AFTER database connection is complete
    logger.info('=== INITIALIZING DEFAULT USERS ===');

    try {
      await initializeOwnerUser();
      logger.info('✅ Owner user initialization completed');
    } catch (err: any) {
      logger.error('Failed to initialize owner user:', err);
    }

    try {
      await initializeAdminUser();
      logger.info('✅ Admin user initialization completed');
    } catch (err: any) {
      logger.error('Failed to initialize admin user:', err);
    }

    logger.info('=== DATABASE INITIALIZATION COMPLETE ===');

  } catch (err: any) {
    logger.error('Database process failed:', err.message);
  }
}