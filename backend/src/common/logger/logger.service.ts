import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(message: any, context?: string, meta?: any): void {
    this.logger.info(message, { context, ...meta });
  }

  error(message: any, stack?: string, context?: string): void {
    this.logger.error(message, { stack, context });
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, { context });
  }

  // Additional custom methods
  http(message: any, meta?: any): void {
    this.logger.http(message, meta);
  }

  logRequest(req: any, res: any, responseTime?: number): void {
    const { method, url, headers, body, user } = req;
    const { statusCode } = res;
    
    this.logger.http('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      userAgent: headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      userId: user?.userId,
      body: this.sanitizeBody(body),
    });
  }

  logError(error: Error, context?: string, meta?: any): void {
    this.logger.error(error.message, {
      stack: error.stack,
      context,
      ...meta,
    });
  }

  logDatabaseOperation(operation: string, collection: string, meta?: any): void {
    this.logger.debug(`Database ${operation}`, {
      collection,
      operation,
      ...meta,
    });
  }

  logAuthentication(event: string, userId?: string, meta?: any): void {
    this.logger.info(`Authentication: ${event}`, {
      userId,
      event,
      ...meta,
    });
  }

  logSecurity(event: string, details: any): void {
    this.logger.warn(`Security Event: ${event}`, {
      event,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;
    
    // Remove sensitive information from logs
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...body };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}