import z from 'zod';

export enum ECURRENCY {
  INR = 'inr',
  USD = 'usd',
  CAD = 'cad',
  AED = 'aed',
}

export enum EMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export const Asset = z.object({
  label: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  type: z.enum(EMediaType),
  url: z.url(),
  thumbnail_url: z.url().nullable().default(null),
  sort_order: z.number().int().nonnegative().default(0),
});

export type TAsset = z.infer<typeof Asset>;
