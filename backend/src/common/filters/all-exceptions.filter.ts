import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let validationErrors = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        validationErrors = (exceptionResponse as any).errors || null;
      } else {
        message = exceptionResponse as string;
      }
    }

    // Create error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(validationErrors && { errors: validationErrors }),
    };

    // Log the error with context
    this.logger.logError(
      exception instanceof Error ? exception : new Error(String(exception)),
      'Global Exception Filter',
      {
        statusCode: status,
        path: request.url,
        method: request.method,
        userId: (request as any).user?.userId,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        body: this.sanitizeRequestBody(request.body),
        query: request.query,
        params: request.params,
      }
    );

    response.status(status).json(errorResponse);
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return undefined;
    
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