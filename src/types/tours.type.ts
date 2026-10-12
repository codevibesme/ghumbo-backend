import z from 'zod';

export enum ETourStatus {
  DRAFT = 'draft',
  LIVE = 'live',
}

export enum ETourTier {
  BUDGET = 'budget',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum ETourAudience {
  OPEN = 'open',
  COUPLES = 'couples',
}

export const ItineraryActivity = z.object({
  title: z.string().min(1),
  description: z.string().nullable().default(null),

  start_time: z.string().nullable().default(null),
  end_time: z.string().nullable().default(null),

  location: z.string().nullable().default(null),

  type: z.enum([
    'sightseeing',
    'activity',
    'meal',
    'transfer',
    'accommodation',
    'free_time',
    'other',
  ]),

  included: z.boolean().default(true),
});

export const ItineraryDay = z.object({
  day: z.number().int().positive(),
  title: z.string().min(1),
  overview: z.string().nullable().default(null),

  location: z.string().nullable().default(null),

  activities: z.array(ItineraryActivity),

  meals: z.array(z.enum(['breakfast', 'lunch', 'dinner'])).default([]),

  accommodation: z.string().nullable().default(null),
});

export const Itinerary = z.object({
  days: z.array(ItineraryDay),
});

export type TItineraryActivity = z.infer<typeof ItineraryActivity>;
export type TItineraryDay = z.infer<typeof ItineraryDay>;
export type TItinerary = z.infer<typeof Itinerary>;

export const TourInclusion = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export type TTourInclusion = z.infer<typeof TourInclusion>;
