import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { producers } from './queue.config.js';
import { QueueService } from './queue.service.js';

@Module({
  imports: [
    SqsModule.register({
      producers,
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
