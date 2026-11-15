import z from 'zod';

export enum ETripStatus {
  DRAFT = 'draft',
  LIVE = 'live',
}

export enum ETripTier {
  BUDGET = 'budget',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum ETripAudience {
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

export const TripInclusion = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const TripTag = z.object({
  label: z.string(),
  description: z.string().nullable().default(null),
});

export const TripHub = z.object({
  name: z.string(),
  type: z.enum(['airport', 'station', 'port', 'bus_stand']),
  city: z.string(),
  code: z.string(),
});

export const TripWhatToPack = z.object({
  title: z.string(),
  description: z.string(),
});

export const TripHighlight = z.object({
  title: z.string(),
  description: z.string(),
});

export const TripCallout = z.object({
  title: z.string(),
  description: z.string(),
});

export const TripMeetingInstruction = z.object({
  title: z.string(),
  description: z.string(),
});

export const TripFAQ = z.object({
  question: z.string(),
  answer: z.string(),
});

export type TItineraryActivity = z.infer<typeof ItineraryActivity>;
export type TItineraryDay = z.infer<typeof ItineraryDay>;
export type TItinerary = z.infer<typeof Itinerary>;
export type TTripInclusion = z.infer<typeof TripInclusion>;
export type TTripTag = z.infer<typeof TripTag>;
export type TTripHub = z.infer<typeof TripHub>;
export type TTripWhatToPack = z.infer<typeof TripWhatToPack>;
export type TTripMeetingInstruction = z.infer<typeof TripMeetingInstruction>;
export type TTripHighlight = z.infer<typeof TripHighlight>;
export type TTripCallout = z.infer<typeof TripCallout>;
export type TTripFAQ = z.infer<typeof TripFAQ>;
