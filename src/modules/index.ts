import { AuthenticationModule } from './authentication/authentication.module.js';
import { BillingModule } from './billings/billings.module.js';
import { BookingTravelerModule } from './booking_travelers/booking_travelers.module.js';
import { BookingModule } from './bookings/bookings.module.js';
import { CountryModule } from './countries/countries.module.js';
import { DestinationModule } from './destinations/destinations.module.js';
import { HealthModule } from './health/health.module.js';
import { TravelerModule } from './travelers/travelers.module.js';

import { TripDepartureModule } from './trip_departures/trip_departures.module.js';
import { TripReviewModule } from './trip_reviews/trip_reviews.module.js';
import { TripModule } from './trips/trips.module.js';
import { UserModule } from './users/users.module.js';
import { WebhookModule } from './webhooks/webhooks.module.js';

export const MODULES = [
  HealthModule,
  WebhookModule,
  UserModule,
  AuthenticationModule,
  CountryModule,
  DestinationModule,
  TripModule,
  TripDepartureModule,
  TripReviewModule,
  BookingModule,
  TravelerModule,
  BookingTravelerModule,
  BillingModule,
];
