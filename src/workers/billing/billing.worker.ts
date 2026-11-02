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
  BillingQueueJob,
  TBillingQueueJob,
} from '../../schemas/queue.schema.js';
import { type Message } from '@aws-sdk/client-sqs';

@Injectable()
export class BillingWorker {
  private readonly logger = new Logger(BillingWorker.name);

  constructor(private readonly queueService: QueueService) {}

  @SqsMessageHandler(QUEUES.BILLING.name, false)
  async handle(message: Message) {
    const attempt = Number(message.Attributes?.ApproximateReceiveCount ?? 1);

    try {
      const job = await this.parse(message);

      this.logger.log(job);
    } catch (err) {
      if (attempt >= SQS_MAX_RECEIVE_COUNT) {
        this.logger.error(
          `Final attempt failed for ${message.MessageId}; moving to DLQ`,
        );
      }

      throw err;
    }
  }

  private async parse(message: Message): Promise<TBillingQueueJob> {
    const result = await BillingQueueJob.safeParseAsync(
      JSON.parse(message.Body ?? ''),
    );

    if (!result.success) {
      throw new UnprocessableEntityException(z.prettifyError(result.error));
    }

    return result.data;
  }

  @SqsConsumerEventHandler(QUEUES.BILLING.name, 'processing_error')
  onError(error: Error, message: Message) {
    this.logger.error(`Failed ${message.MessageId}: ${error.message}`);
  }
}
