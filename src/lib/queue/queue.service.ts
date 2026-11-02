import { Injectable, Logger } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import { TQueueJob } from '../../schemas/queue.schema.js';
import { Message } from '@ssut/nestjs-sqs/dist/sqs.types.js';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly sqs: SqsService) {}

  async notify(name: string, payload: Message<TQueueJob>) {
    this.logger.log(`Sending to queue: ${name}, Message ID: ${payload.id}`);

    await this.sqs.send(name, payload);
  }
}
