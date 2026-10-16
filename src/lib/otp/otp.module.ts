import { Module } from '@nestjs/common';
import { OtpService } from './otp.service.js';
import { EmailModule } from '../email/email.module.js';
import { CacheModule } from '../cache/cache.module.js';

@Module({
  imports: [EmailModule, CacheModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
