import z from 'zod';

const MAX_VALUE = 2000;
const text = z.string().trim().min(1).max(MAX_VALUE);
const url = z.url().max(MAX_VALUE);
const optionalText = text.optional();
const rowSlot = z.string().max(MAX_VALUE).optional();

export enum EEMAIL_TEMPLATES {
  AUTH_SIGN_IN_CODE = 'auth-sign-in-code',
  LIFECYCLE_WELCOME = 'lifecycle-welcome',
  TRIP_REQUEST_RECEIVED = 'trip-request-received',
  TRIP_MISSED_CALL = 'trip-missed-call',
  TRIP_SEAT_CONFIRMED = 'trip-seat-confirmed',
  TRIP_PACK = 'trip-pack',
  TRIP_DEPARTURE_TOMORROW = 'trip-departure-tomorrow',
  LIFECYCLE_AFTER_TRIP = 'lifecycle-after-trip',
  LIFECYCLE_WAITLIST_OPEN = 'lifecycle-waitlist-open',
  LIFECYCLE_REVIEW_REMINDER = 'lifecycle-review-reminder',
  BILLING_DEPOSIT_RECEIPT = 'billing-deposit-receipt',
}

export const AuthEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.AUTH_SIGN_IN_CODE),
  variables: z.strictObject({
    CODE: text,
    EXPIRES_AT: text,
    REQUESTED_AT: text,
    DEVICE: optionalText,
    LOCATION: optionalText,
    ACCOUNT_EMAIL: z.email(),
  }),
});

export const LifecycleWelcomeEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.LIFECYCLE_WELCOME),
  variables: z.strictObject({
    USER_NAME: optionalText,
    ACCOUNT_EMAIL: z.email(),
    TRIP_1_NAME: text,
    TRIP_1_DATE: text,
    TRIP_1_SEATS: text,
    TRIP_1_PRICE: text,
    TRIP_2_NAME: text,
    TRIP_2_DATE: text,
    TRIP_2_SEATS: text,
    TRIP_2_PRICE: text,
    TRIP_3_NAME: text,
    TRIP_3_DATE: text,
    TRIP_3_SEATS: text,
    TRIP_3_PRICE: text,
    UNSUBSCRIBE_LINK: url,
  }),
});

export const TripRequestReceivedEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.TRIP_REQUEST_RECEIVED),
  variables: z.strictObject({
    USER_NAME: optionalText,
    BOOKING_REF: text,
    TRIP_NAME: text,
    TRIP_SHORT: text,
    DEPARTURE_DATE: text,
    DEPARTURE_DATES: text,
    TRAVELLERS: text,
    ESTIMATE: text,
    SUPPORT_PHONE: text,
    DEPOSIT_AMOUNT: text,
    TRACK_URL: url,
  }),
});

export const TripMissedCallEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.TRIP_MISSED_CALL),
  variables: z.strictObject({
    USER_NAME: optionalText,
    TRIP_SHORT: text,
    TRIP_NAME: text,
    CALLED_AT: text,
    SUPPORT_PHONE: text,
    USER_PHONE: text,
    SLOT_1_LABEL: text,
    SLOT_1_URL: url,
    SLOT_2_LABEL: text,
    SLOT_2_URL: url,
    SLOT_3_LABEL: text,
    SLOT_3_URL: url,
    SEATS_LEFT: text,
    DEPARTURE_DATE: text,
    DEPARTURE_DATES: text,
    BOOKING_REF: text,
  }),
});

export const TripSeatConfirmedEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.TRIP_SEAT_CONFIRMED),
  variables: z.strictObject({
    USER_NAME: optionalText,
    TRIP_SHORT: text,
    DEPARTURE_DATE: text,
    BOOKING_REF: text,
    SEATS_TEXT: text,
    FROM_POINT: text,
    DURATION_PAX: text,
    DEPARTURE_DATES: text,
    PICKUP: text,
    LEAVES_AT: text,
    STAY: text,
    DEPOSIT_AMOUNT: text,
    BALANCE_DUE_DATE: text,
    TRIP_TOTAL: text,
    COORDINATOR_NAME: text,
    COORDINATOR_NOTE: text,
    TRIP_URL: url,
    TRIP_PACK_DATE: text,
  }),
});

export const TripPackEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.TRIP_PACK),
  variables: z.strictObject({
    USER_NAME: optionalText,
    TRIP_SHORT: text,
    DEPARTURE_DATE: text,
    HERO_IMAGE_URL: url,
    HERO_IMAGE_ALT: text,
    PICKUP_POINT: text,
    PICKUP_TIME: text,
    LEAVES_AT: text,
    COORDINATOR_NAME: text,
    COORDINATOR_PHONE: text,
    DAY_1_HTML: rowSlot,
    DAY_2_HTML: rowSlot,
    DAY_3_HTML: rowSlot,
    DAY_4_HTML: rowSlot,
    DAY_5_HTML: rowSlot,
    DAY_6_HTML: rowSlot,
    DAY_7_HTML: rowSlot,
    DAY_8_HTML: rowSlot,
    HEADS_UP_TITLE: text,
    HEADS_UP_BODY: text,
    PACK_1_HTML: rowSlot,
    PACK_2_HTML: rowSlot,
    PACK_3_HTML: rowSlot,
    PACK_4_HTML: rowSlot,
    PACK_5_HTML: rowSlot,
    PACK_6_HTML: rowSlot,
    PACK_7_HTML: rowSlot,
    PACK_8_HTML: rowSlot,
    TRIP_URL: url,
  }),
});

export const TripDepartureTomorrowEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.TRIP_DEPARTURE_TOMORROW),
  variables: z.strictObject({
    USER_NAME: optionalText,
    DEPARTURE_DATE: text,
    BOOKING_REF: text,
    PICKUP_TIME: text,
    LEAVES_AT: text,
    PICKUP_POINT: text,
    COORDINATOR_NAME: text,
    COORDINATOR_PHONE: text,
    HEADS_UP_TITLE: text,
    HEADS_UP_BODY: text,
    CHECK_1_HTML: rowSlot,
    CHECK_2_HTML: rowSlot,
    CHECK_3_HTML: rowSlot,
    CHECK_4_HTML: rowSlot,
    CHECK_5_HTML: rowSlot,
    CHECK_6_HTML: rowSlot,
    TRIP_URL: url,
  }),
});

export const LifecycleAfterTripEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.LIFECYCLE_AFTER_TRIP),
  variables: z.strictObject({
    USER_NAME: optionalText,
    TRIP_SHORT: text,
    TRIP_END_DATE: text,
    REVIEW_URL: url,
    REVIEWER_DISPLAY: text,
    NEXT_1_NAME: text,
    NEXT_1_META: text,
    NEXT_1_DATE: text,
    NEXT_1_PRICE: text,
    NEXT_1_URL: url,
    NEXT_1_IMAGE_URL: url,
    NEXT_1_IMAGE_ALT: text,
    NEXT_2_NAME: text,
    NEXT_2_META: text,
    NEXT_2_DATE: text,
    NEXT_2_PRICE: text,
    NEXT_2_URL: url,
    NEXT_2_IMAGE_URL: url,
    NEXT_2_IMAGE_ALT: text,
    NEXT_3_NAME: text,
    NEXT_3_META: text,
    NEXT_3_DATE: text,
    NEXT_3_PRICE: text,
    NEXT_3_URL: url,
    NEXT_3_IMAGE_URL: url,
    NEXT_3_IMAGE_ALT: text,
    UNSUBSCRIBE_LINK: url,
  }),
});

export const LifecycleWaitlistOpenEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.LIFECYCLE_WAITLIST_OPEN),
  variables: z.strictObject({
    DESTINATION: text,
    DESTINATION_BLURB: text,
    DEPARTURE_DATES: text,
    PRICE_FROM: text,
    GROUP_SIZE: text,
    ACCESS_END_DATE: text,
    DESTINATION_URL: url,
    UNSUBSCRIBE_LINK: url,
  }),
});

export const LifecycleReviewReminderEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.LIFECYCLE_REVIEW_REMINDER),
  variables: z.strictObject({
    USER_NAME: optionalText,
    TRIP_SHORT: text,
    TRIP_END_DATE: text,
    DAYS_SINCE: text,
    REVIEW_URL: url,
    REVIEWER_DISPLAY: text,
    UNSUBSCRIBE_LINK: url,
  }),
});

export const BillingDepositReceiptEmailTemplate = z.object({
  id: z.literal(EEMAIL_TEMPLATES.BILLING_DEPOSIT_RECEIPT),
  variables: z.strictObject({
    USER_NAME: optionalText,
    BOOKING_REF: text,
    TRIP_NAME: text,
    TRIP_SHORT: text,
    DEPARTURE_DATE: text,
    TRAVELLERS: text,
    DEPOSIT_AMOUNT: text,
    RECEIPT_NUMBER: text,
    PAID_AT: text,
    PAYMENT_METHOD: text,
    TRIP_TOTAL: text,
    BALANCE_AMOUNT: text,
    BALANCE_DUE_DATE: text,
    INVOICE_URL: url,
  }),
});

export const EmailTemplate = z.discriminatedUnion('id', [
  AuthEmailTemplate,
  LifecycleWelcomeEmailTemplate,
  TripRequestReceivedEmailTemplate,
  TripMissedCallEmailTemplate,
  TripSeatConfirmedEmailTemplate,
  TripPackEmailTemplate,
  TripDepartureTomorrowEmailTemplate,
  LifecycleAfterTripEmailTemplate,
  LifecycleWaitlistOpenEmailTemplate,
  LifecycleReviewReminderEmailTemplate,
  BillingDepositReceiptEmailTemplate,
]);

export type TEmailTemplatePayload = z.infer<typeof EmailTemplate>;

export const EmailAttachment = z.object({
  path: url,
  filename: text,
});

export const SendEmailTemplate = z.object({
  to: text,
  template: EmailTemplate,
  attachments: z.array(EmailAttachment).optional(),
  idempotencyKey: optionalText,
  scheduledAt: optionalText,
  unsubscribeUrl: optionalText,
});

export type TSendEmailTemplate = z.infer<typeof SendEmailTemplate>;
