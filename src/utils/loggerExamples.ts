import logger from './logger';

// Example usage of different log levels.
const err = new Error('Connection timeout');
const decoded = { sub: 'userId123', iat: 1697059200 };
const req = {
  headers: {
    authorization: 'Bearer token123',
    'user-agent': 'Mozilla/5.0'
  }
};

// Different log levels
logger.error('Database connection failed', { error: err });
logger.warn('Rate limit exceeded for user', { userId: '123' });
logger.info('User logged in successfully', { username: 'admin' });
logger.http('GET /api/cards - 200ms', { method: 'GET', url: '/api/cards', duration: 200 });
logger.verbose('Processing card validation', { cardId: '456' });
logger.debug('JWT token payload', { payload: decoded });
logger.silly('Raw request headers', { headers: req.headers });