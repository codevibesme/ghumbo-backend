import { Module } from '@nestjs/common';
import { OtpService } from './otp.service.js';
import { CacheModule } from '../cache/cache.module.js';
import { QueueModule } from '../queue/queue.module.js';

@Module({
  imports: [QueueModule, CacheModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
