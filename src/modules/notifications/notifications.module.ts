import { Module } from '@nestjs/common';
import { EmailModule } from '../../lib/email/email.module.js';
import { EmailService } from '../../lib/email/email.service.js';
import { NotificationService } from './notifications.service.js';

@Module({
  imports: [EmailModule],
  providers: [NotificationService, EmailService],
  exports: [NotificationService],
})
export class NotificationModule {}
