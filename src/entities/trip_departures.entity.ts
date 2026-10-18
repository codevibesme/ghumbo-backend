import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { TripEntity } from './trips.entity.js';
import { TripDeparturePriceEntity } from './trip_departure_prices.entity.js';
import { BookingRequestEntity } from './booking_requests.entity.js';
import { ETripDepartureStatus } from '../schemas/trip_departures.schema.js';
import { BookingEntity } from './bookings.entity.js';

@Entity('trip_departures')
@Check('chk_trip_departures_capacity', `"capacity" > 0`)
@Check(
  'chk_trip_departures_booked_seats',
  `"booked_seats" >= 0 AND "booked_seats" <= "capacity"`,
)
@Check('chk_trip_departures_dates', `"end_date" >= "start_date"`)
export class TripDepartureEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Index('idx_trip_departures_trip_id')
  @Column({ name: 'trip_id', type: 'varchar', length: 26 })
  tripId: string;

  @ManyToOne(() => TripEntity, (trip) => trip.departures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'trip_id',
    foreignKeyConstraintName: 'fk_trip_departures_trip_id',
  })
  trip: Relation<TripEntity>;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ETripDepartureStatus,
    default: ETripDepartureStatus.DRAFT,
  })
  status: ETripDepartureStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'capacity', type: 'integer' })
  capacity: number;

  @Column({ name: 'booked_seats', type: 'integer', default: 0 })
  bookedSeats: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => TripDeparturePriceEntity, (prices) => prices.departure)
  prices: TripDeparturePriceEntity[];

  @OneToMany(
    () => BookingRequestEntity,
    (bookingRequests) => bookingRequests.departure,
  )
  bookingRequests: BookingRequestEntity[];

  @OneToMany(() => BookingEntity, (bookings) => bookings.departure)
  bookings: BookingEntity[];
}
