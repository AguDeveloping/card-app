import mongoose from 'mongoose';
import logger from '../utils/logger';

// Database connection options
const dbOptions = {
  // No authentication options needed here - they're in the connection string
};

// Connect to MongoDB
export const connectToDatabase = async (): Promise<void> => {
  try {
    logger.info('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    logger.info('Using MongoDB URI: ', mongoUri ? 'set' : 'not set');
    await mongoose.connect(mongoUri!);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1); // Exit with failure
  }
};

// Disconnect from MongoDB
export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};
