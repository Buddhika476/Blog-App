import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { format } from 'winston';

const { combine, timestamp, errors, json, printf, colorize, simple } = format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack, context, ...meta }) => {
  let log = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  if (Object.keys(meta).length > 0) {
    log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
  }
  
  return log;
});

// Custom format for production
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
  format((info) => {
    // Add additional context for production logs
    info.service = 'blog-app-backend';
    info.version = process.env.npm_package_version || '1.0.0';
    info.environment = process.env.NODE_ENV || 'development';
    return info;
  })()
);

export const winstonConfig: WinstonModuleOptions = {
  level: process.env.LOG_LEVEL || 'debug',
  format: process.env.NODE_ENV === 'production' ? prodFormat : combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    colorize({ all: true }),
    devFormat
  ),
  defaultMeta: {
    service: 'blog-app-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    
    // File transport for HTTP requests
    new winston.transports.File({
      filename: 'logs/http.log',
      level: 'http',
      format: combine(
        timestamp(),
        json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
    }),
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/rejections.log',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
    }),
  ],
  
  // Exit on handled exceptions
  exitOnError: false,
};

// Add daily rotate file transport for production
if (process.env.NODE_ENV === 'production') {
  const DailyRotateFile = require('winston-daily-rotate-file');
  
  // Ensure transports is an array before pushing
  if (!Array.isArray(winstonConfig.transports)) {
    winstonConfig.transports = [winstonConfig.transports];
  }
  
  winstonConfig.transports.push(
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
    }),
    
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
    })
  );
}