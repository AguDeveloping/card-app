import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.colorize({ all: true }), // <--- This adds color to all output
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Custom date & hour format
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`) // Format output
  ),
  transports: [
    new transports.Console(), // Print to console
    //new transports.File({ filename: 'logs/app.log' }), // Uncomment to log to a file
  ],
});

export default logger;