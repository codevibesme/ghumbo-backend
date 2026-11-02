import z from 'zod';
import { SendEmailTemplate } from './emails.schema.js';

export const SendEmailNotification = z.object({
  channel: z.literal('email'),
  destination: z.string(),
  userId: z.string().optional(),
  payload: SendEmailTemplate,
  idempotencyKey: z.string(),
});

export const SendNotification = z.discriminatedUnion('channel', [
  SendEmailNotification,
]);

export type TSendNotification = z.infer<typeof SendNotification>;
