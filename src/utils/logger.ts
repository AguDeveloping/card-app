import { createLogger, format, transports, Logger } from 'winston';
import path from 'path';
import fs from 'fs';

// Extend Winston Logger interface to include our custom method
interface ExtendedLogger extends Logger {
  setLogLevel: (level: string) => void;
}

// Get configuration from environment
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Ensure logs directory exists. Only in development.
let logsDir = undefined;
if (NODE_ENV === 'development') {
  logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// Console format for all environments
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  // Remove colorization in production for better Railway log parsing
  ...(IS_PRODUCTION ? [] : [format.colorize({ all: true })]),
  format.printf(({ timestamp, level, message, stack, service, ...meta }) => {
    const serviceTag = service ? `[${service}] ` : '';
    let output = `${timestamp} [${level}] ${serviceTag}${message}`;

    if (stack) {
      output += '\n' + stack;
    }

    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      output += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return output;
  })
);

// ✅ Enhanced file format that also handles all arguments
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(), // ✅ Also needed for file format
  format.printf(({ timestamp, level, message, stack, service, ...meta }) => {
    const serviceTag = service ? `[${service}] ` : '';
    let output = `${timestamp} [${level}] ${serviceTag}${message}`;
    // ✅ Handle error stacks
    if (stack) {
      output += '\n' + stack;
    }
    // Include additional metadata if any
    const metaKeys = Object.keys(meta);
    // console.log('Meta keys:', Object.keys(meta));
    if (metaKeys.length > 0) {
      output += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return output;
  })
);

// ✅ JSON format for structured analysis
const jsonFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Create logger with Railway-compatible configuration
const logger = createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'card-app' },
  transports: [
    // Always use console in production (Railway captures console output)
    new transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL
    })
  ],
  // Add file transports only in development
  ...(NODE_ENV === 'development' ? {
    transports: [
      new transports.Console({
        format: consoleFormat,
        level: LOG_LEVEL
      }),
      // Only add file transports in development
      // Info logs
      new transports.File({
        filename: path.join(logsDir ? logsDir : '', 'app.log'),
        format: fileFormat, // ✅ Using enhanced file format
        level: 'info',
        maxsize: 5242880,
        maxFiles: 5,
      }),

      // Debug logs  
      new transports.File({
        filename: path.join(logsDir ? logsDir : '', 'debug.log'),
        format: fileFormat,
        level: 'debug',
        maxsize: 10485760,
        maxFiles: 3,
      }),

      // Error logs (JSON format for analysis)
      new transports.File({
        filename: path.join(logsDir ? logsDir : '', 'error.log'),
        format: jsonFormat, // ✅ JSON format for error analysis
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5,
      })
    ]
  } : {})
}) as ExtendedLogger;

// Dynamic wrapper for all levels (simplified for production)
const levels = ['error', 'warn', 'info', 'debug'] as const;

for (const level of levels) {
  const original = (logger as any)[level].bind(logger);
  (logger as any)[level] = (...args: any[]) => {
    if (args.length === 0) return;

    const msg = args
      .map(a => {
        if (typeof a === 'object') {
          try {
            return JSON.stringify(a, null, IS_PRODUCTION ? 0 : 2);
          } catch (err) {
            return String(a);
          }
        }
        return String(a);
      })
      .join(' ');

    original(msg);
  };
}

// Add the custom method
logger.setLogLevel = function (setLevel: string) {
  this.level = setLevel;
  this.transports.forEach(transport => {
    if (transport instanceof transports.Console) {
      transport.level = setLevel;
    }
  });
  this.info(`Log level changed to: ${this.level}`);
};

// Log startup information
if (IS_PRODUCTION) {
  console.log('[LOGGER] Production mode: Using console-only logging for Railway');
} else {
  console.log('[LOGGER] Development mode: Using console + file logging');
}

export default logger;