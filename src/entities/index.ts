import { CountryEntity } from './countries.entity.js';
import { DestinationEntity } from './destinations.entity.js';
import { BookingRequestEntity } from './booking_requests.entity.js';
import { TripDeparturePriceEntity } from './trip_departure_prices.entity.js';
import { TripDepartureEntity } from './trip_departures.entity.js';
import { TripEntity } from './trips.entity.js';
import { AuthSessionEntity } from './auth_sessions.entity.js';
import { UserEntity } from './users.entity.js';
import { AuthIdentityEntity } from './auth_identities.entity.js';
import { TripReviewEntity } from './trip_reviews.entity.js';
import { TravelerEntity } from './travelers.entity.js';
import { BookingEntity } from './bookings.entity.js';
import { BookingPaymentEntity } from './booking_payments.entity.js';
import { BookingTravelerEntity } from './booking_travelers.entity.js';

const ENTITIES = [
  UserEntity,
  AuthIdentityEntity,
  AuthSessionEntity,
  CountryEntity,
  DestinationEntity,
  TripEntity,
  TripDepartureEntity,
  TripDeparturePriceEntity,
  BookingRequestEntity,
  TripReviewEntity,
  TravelerEntity,
  BookingEntity,
  BookingPaymentEntity,
  BookingTravelerEntity,
];

export default ENTITIES;
