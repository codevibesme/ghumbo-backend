import { Module } from '@nestjs/common';

import { SqsModule } from '@ssut/nestjs-sqs';
import { producers, consumers } from '../lib/queue/queue.config.js';
import { QueueService } from '../lib/queue/queue.service.js';
import { BillingWorker } from './billing/billing.worker.js';
import { NotificationModule } from '../modules/notifications/notifications.module.js';
import { NotificationWorker } from './notification/notification.worker.js';

@Module({
  imports: [
    SqsModule.register({
      producers,
      consumers,
    }),
    NotificationModule,
  ],
  providers: [QueueService, BillingWorker, NotificationWorker],
})
export class WorkerModule {}
