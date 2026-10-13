import { CountryEntity } from './countries.entity.js';
import { DestinationEntity } from './destinations.entity.js';
import { BookingRequestEntity } from './booking_requests.entity.js';
import { TourDeparturePriceEntity } from './tour_departure_prices.entity.js';
import { TourDepartureEntity } from './tour_departures.entity.js';
import { TourEntity } from './tours.entity.js';
import { AuthSessionEntity } from './auth_sessions.entity.js';
import { UserEntity } from './users.entity.js';
import { AuthIdentityEntity } from './auth_identities.entity.js';
import { TourReviewEntity } from './tour_reviews.entity.js';
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
  TourEntity,
  TourDepartureEntity,
  TourDeparturePriceEntity,
  BookingRequestEntity,
  TourReviewEntity,
  TravelerEntity,
  BookingEntity,
  BookingPaymentEntity,
  BookingTravelerEntity,
];

export default ENTITIES;
