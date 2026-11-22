import { Module } from '@nestjs/common';
import { WebhookController } from './webhooks.controller.js';
import { BillingModule } from '../billings/billings.module.js';

@Module({
  imports: [BillingModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
