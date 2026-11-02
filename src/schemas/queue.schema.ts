import z from 'zod';
import { SendNotification } from './notifications.schema.js';

export const BillingQueueJob = z.object({
  type: z.literal('BILLING'),
  idempotencyKey: z.string().optional(),
  eventType: z.string(),
  data: z.object({
    bookingId: z.string(),
  }),
});

export const NotificationQueueJob = z.object({
  type: z.literal('NOTIFICATION'),
  idempotencyKey: z.string().optional(),
  eventType: z.string(),
  data: SendNotification,
});

export const QueueJob = z.discriminatedUnion('type', [
  BillingQueueJob,
  NotificationQueueJob,
]);

export type TQueueJob = z.infer<typeof QueueJob>;
export type TBillingQueueJob = z.infer<typeof BillingQueueJob>;
export type TNotificationQueueJob = z.infer<typeof NotificationQueueJob>;
