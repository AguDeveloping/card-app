import { createLogger, format, transports, Logger } from 'winston';
import path from 'path';
import fs from 'fs';

// Extend Winston Logger interface to include our custom method
interface ExtendedLogger extends Logger {
  setLogLevel: (level: string) => void;
}

// Get log level from environment variable (default to 'info')
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ✅ Enhanced console format that handles ALL arguments
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }), // ✅ Handle error stacks
  format.splat(), // ✅ Handle string interpolation and multiple arguments
  format.colorize({ all: true }),
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

const logger = createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'card-app' },
  transports: [
    // Console transport
    ...(NODE_ENV === 'development' || process.env.ENABLE_CONSOLE_LOG === 'true' ? [
      new transports.Console({
        format: consoleFormat, // ✅ Using enhanced format
        level: LOG_LEVEL
      })
    ] : []),

    // General application logs
    new transports.File({
      filename: path.join(logsDir, 'app.log'),
      format: fileFormat, // ✅ Using enhanced file format
      level: 'info',
      maxsize: 5242880,
      maxFiles: 5,
    }),

    // Debug logs  
    new transports.File({
      filename: path.join(logsDir, 'debug.log'),
      format: fileFormat,
      level: 'debug',
      maxsize: 10485760,
      maxFiles: 3,
    }),

    // Error logs (JSON format for analysis)
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: jsonFormat, // ✅ JSON format for error analysis
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    })
  ],

}) as ExtendedLogger;

// === Dynamic wrapper for all levels ===
const levels = Object.keys(logger.levels) as (keyof typeof logger.levels)[];
// console.log(levels);

// Create wrapper dynamically
for (const level of levels) {
  const original = (logger as any)[level].bind(logger);
  (logger as any)[level] = (...args: any[]) => {
    if (args.length === 0) return;
    const msg = args
      .map(a => {
        if (typeof a === 'object') {
          return JSON.stringify(a, null, 2); // pretty print
        }
        return String(a);
      })
      .join(' ');

    // console.log(`[WRAPPER] ${level} called with args:`, args);
    original(msg);
  };
}

// ✅ Add the custom method properly
logger.setLogLevel = function (setLevel: string) {
  this.level = setLevel;
  this.transports.forEach(transport => {
    // Only update console transport level
    if (transport instanceof transports.Console) {
      transport.level = setLevel;
    }
  });
  this.info(`Log level changed to: ${this.level}`);
};

export default logger;