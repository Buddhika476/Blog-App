import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        this.logger.logRequest(request, response, responseTime);
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        
        // Log the error with request context
        this.logger.logError(error, 'HTTP Request Error', {
          method,
          url,
          responseTime: `${responseTime}ms`,
          statusCode: response.statusCode,
          userId: request.user?.userId,
        });
        
        throw error;
      }),
    );
  }
}