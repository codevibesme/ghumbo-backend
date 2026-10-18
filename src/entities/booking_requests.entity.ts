import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { EBookingRequestStatus } from '../schemas/booking_requests.schema.js';
import { TripEntity } from './trips.entity.js';
import { TripDepartureEntity } from './trip_departures.entity.js';
import { UserEntity } from './users.entity.js';
import { generateBookingRequestCode } from '../utilities/codes/codes.js';
import { BookingEntity } from './bookings.entity.js';

@Entity('booking_requests')
@Index('idx_booking_requests_status_created_at', ['status', 'createdAt'])
@Check('chk_booking_requests_traveler_count', `"traveler_count" > 0`)
export class BookingRequestEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Index('idx_booking_requests_trip_id')
  @Column({ name: 'trip_id', type: 'varchar', length: 26 })
  tripId: string;

  @ManyToOne(() => TripEntity, (trip) => trip.bookingRequests, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'trip_id',
    foreignKeyConstraintName: 'fk_booking_requests_trip_id',
  })
  trip: Relation<TripEntity>;

  @Index('idx_booking_requests_trip_departure_id')
  @Column({
    name: 'trip_departure_id',
    type: 'varchar',
    length: 26,
    nullable: true,
  })
  tripDepartureId: string | null;

  @ManyToOne(
    () => TripDepartureEntity,
    (departure) => departure.bookingRequests,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'trip_departure_id',
    foreignKeyConstraintName: 'fk_booking_requests_trip_departure_id',
  })
  departure: Relation<TripDepartureEntity> | null;

  @Index('idx_booking_requests_user_id')
  @Column({ name: 'user_id', type: 'varchar', length: 26, nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, (user) => user.bookingRequests, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_booking_requests_user_id',
  })
  user: Relation<UserEntity> | null;

  @Column({ name: 'code', type: 'varchar', length: 9, unique: true })
  code: string = generateBookingRequestCode();

  @Column({ name: 'travel_date', type: 'date', nullable: true })
  travelDate: string | null;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'email', type: 'varchar', length: 254 })
  email: string;

  @Column({ name: 'phone', type: 'varchar', length: 16, nullable: true })
  phone: string | null;

  @Column({ name: 'traveler_count', type: 'integer' })
  travelerCount: number;

  @Column({ name: 'query', type: 'text', nullable: true })
  query: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EBookingRequestStatus,
    default: EBookingRequestStatus.NEW,
  })
  status: EBookingRequestStatus;

  @Column({ name: 'status_notes', type: 'text', nullable: true })
  statusNotes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => BookingEntity, (booking) => booking.request)
  booking: Relation<BookingEntity> | null;
}
