import { Module } from '@nestjs/common';

import { SqsModule } from '@ssut/nestjs-sqs';
import { producers, consumers } from '../lib/queue/queue.config.js';
import { QueueService } from '../lib/queue/queue.service.js';
import { BillingWorker } from './billing/billing.worker.js';
import { NotificationModule } from '../modules/notifications/notifications.module.js';
import { NotificationWorker } from './notification/notification.worker.js';
import { BillingModule } from '../modules/billings/billings.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import dbConfig from '../configs/db.config.js';

@Module({
  imports: [
    SqsModule.register({
      producers,
      consumers,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => dbConfig,
    }),
    NotificationModule,
    BillingModule,
  ],
  providers: [QueueService, BillingWorker, NotificationWorker],
})
export class WorkerModule {}
