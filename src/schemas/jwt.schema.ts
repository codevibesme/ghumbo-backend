import { z } from 'zod';
import { EUserRole } from './users.schema.js';

export enum ETokenFor {
  USER = 'user',
}

export const VerifiedUserPayloadSchema = z.object({
  type: z.literal(ETokenFor.USER),
  role: z.enum(EUserRole),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  session: z.object({
    id: z.string(),
    expiresAt: z.coerce.string(),
    revokedAt: z.string().nullable().default(null),
    lastUsedAt: z.coerce.string(),
  }),
});

export const VerifiedTokenPayloadSchema = z.discriminatedUnion('type', [
  VerifiedUserPayloadSchema,
]);

export type TVerifiedTokenPayload = z.infer<typeof VerifiedTokenPayloadSchema>;
export type TVerifiedUserPayload = z.infer<typeof VerifiedUserPayloadSchema>;
