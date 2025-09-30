import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppLoggerService } from './logger.service';
import { winstonConfig } from './winston.config';

@Global()
@Module({
  imports: [WinstonModule.forRoot(winstonConfig)],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}