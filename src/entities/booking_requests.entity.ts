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
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { EBookingRequestStatus } from '../schemas/booking_requests.schema.js';
import { TripDepartureEntity } from './trip_departures.entity.js';
import { UserEntity } from './users.entity.js';
import { generateBookingRequestCode } from '../utilities/codes/codes.js';
import { BookingEntity } from './bookings.entity.js';

@Entity('booking_requests')
@Index('idx_booking_requests_status_created_at', ['status', 'createdAt'])
@Check('chk_booking_requests_traveler_count', `"traveler_count" > 0`)
@Unique('uq_booking_requests_email_trip_departure_id', ['email', 'tripDepartureId'])
@Unique('uq_booking_requests_user_id_trip_departure_id', ['userId', 'tripDepartureId'])
export class BookingRequestEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Index('idx_booking_requests_trip_departure_id')
  @Column({
    name: 'trip_departure_id',
    type: 'varchar',
    length: 26
  })
  tripDepartureId: string;

  @ManyToOne(
    () => TripDepartureEntity,
    (departure) => departure.bookingRequests,
    {
      onDelete: 'NO ACTION',
    },
  )
  @JoinColumn({
    name: 'trip_departure_id',
    foreignKeyConstraintName: 'fk_booking_requests_trip_departure_id',
  })
  departure: Relation<TripDepartureEntity>;

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
