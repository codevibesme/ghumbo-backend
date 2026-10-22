import { AuthenticationModule } from './authentication/authentication.module.js';
import { CountryModule } from './countries/countries.module.js';
import { DestinationModule } from './destinations/destinations.module.js';
import { TripDepartureModule } from './trip_departures/trip_departures.module.js';
import { TripReviewModule } from './trip_reviews/trip_reviews.module.js';
import { TripModule } from './trips/trips.module.js';
import { UserModule } from './users/users.module.js';

export const MODULES = [
  UserModule,
  AuthenticationModule,
  CountryModule,
  DestinationModule,
  TripModule,
  TripDepartureModule,
  TripReviewModule
];
