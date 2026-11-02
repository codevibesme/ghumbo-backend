import { SQSClient } from '@aws-sdk/client-sqs';
import {
  SqsProducerOptions,
  SqsConsumerOptions,
} from '@ssut/nestjs-sqs/dist/sqs.types.js';

export const SQS_MAX_RECEIVE_COUNT = 4;

export const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
});

export const QUEUES = {
  BILLING: {
    name: process.env.BILLING_QUEUE_NAME || '',
    batchSize: 5,
    visibilityTimeout: 120,
    waitTimeSeconds: 20,
    messageAttributeNames: ['ApproximateReceiveCount'],
  },

  NOTIFICATION: {
    name: process.env.NOTIFICATION_QUEUE_NAME || '',
    batchSize: 5,
    visibilityTimeout: 30,
    waitTimeSeconds: 20,
    messageAttributeNames: ['ApproximateReceiveCount'],
  },
};

export const DLQS = {
  BILLING: {
    name: process.env.BILLING_DLQ_NAME || '',
  },
  NOTIFICATION: {
    name: process.env.NOTIFICATION_DLQ_NAME || '',
  },
};

export const queueUrl = (name: string): string => {
  return (
    process.env.QUEUE_BASE_URL +
    '/' +
    process.env.QUEUE_NAME_PREFIX +
    '-' +
    name
  );
};

export const producers: SqsProducerOptions[] = [
  ...Object.values(QUEUES),
  ...Object.values(DLQS),
].map((queue) => ({
  name: queue.name,
  queueUrl: queueUrl(queue.name),
  sqs: sqsClient,
}));

export const consumers: SqsConsumerOptions[] = Object.values(QUEUES).map(
  (queue) => ({
    queueUrl: queueUrl(queue.name),
    sqs: sqsClient,
    ...queue,
  }),
);
