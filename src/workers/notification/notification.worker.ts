import z from 'zod';
import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { QueueService } from '../../lib/queue/queue.service.js';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
import { QUEUES, SQS_MAX_RECEIVE_COUNT } from '../../lib/queue/queue.config.js';

import {
  NotificationQueueJob,
  TNotificationQueueJob,
} from '../../schemas/queue.schema.js';
import { type Message } from '@aws-sdk/client-sqs';
import { NotificationService } from '../../modules/notifications/notifications.service.js';

@Injectable()
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly queueService: QueueService,
  ) {}

  @SqsMessageHandler(QUEUES.NOTIFICATION.name, false)
  async handle(message: Message) {
    const attempt = Number(message.Attributes?.ApproximateReceiveCount ?? 1);

    try {
      const job = await this.parse(message);
      await this.notificationService.sendNotification(job.data);
    } catch (err) {
      if (attempt >= SQS_MAX_RECEIVE_COUNT) {
        this.logger.error(
          `Final attempt failed for ${message.MessageId}; moving to DLQ`,
        );
      }

      throw err;
    }
  }

  private async parse(message: Message): Promise<TNotificationQueueJob> {
    const result = await NotificationQueueJob.safeParseAsync(
      JSON.parse(message.Body ?? ''),
    );

    if (!result.success) {
      throw new UnprocessableEntityException(z.prettifyError(result.error));
    }

    return result.data;
  }

  @SqsConsumerEventHandler(QUEUES.NOTIFICATION.name, 'processing_error')
  onError(error: Error, message: Message) {
    this.logger.error(`Failed ${message.MessageId}: ${error.message}`);
  }
}
