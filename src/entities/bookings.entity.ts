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
import {
  EBookingRefundStatus,
  EBookingStatus,
} from '../schemas/bookings.schema.js';
import { ECURRENCY } from '../schemas/misc.schema.js';
import { generateBookingCode } from '../utilities/codes/codes.js';
import { UserEntity } from './users.entity.js';
import { TripDepartureEntity } from './trip_departures.entity.js';
import { BookingTravelerEntity } from './booking_travelers.entity.js';

@Entity('bookings')
@Index('idx_bookings_departure_id_status', ['departureId', 'status'])
@Index('uq_bookings_departure_id_user_id', ['departureId', 'userId'], {
  unique: true,
  where: "status IN ('pending')",
})
@Check('chk_bookings_traveler_count', `"traveler_count" > 0`)
@Check('chk_bookings_amount', `"amount" >= 0`)
export class BookingEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ name: 'code', type: 'varchar', length: 9, unique: true })
  code: string = generateBookingCode();

  @Index('idx_bookings_user_id')
  @Column({ name: 'user_id', type: 'varchar', length: 26, default: null })
  userId: string | null;

  @ManyToOne(() => UserEntity, (user) => user.bookings, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_bookings_user_id',
  })
  user: Relation<UserEntity> | null;

  @Column({ name: 'departure_id', type: 'varchar', length: 26 })
  departureId: string;

  @ManyToOne(() => TripDepartureEntity, (departure) => departure.bookings, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({
    name: 'departure_id',
    foreignKeyConstraintName: 'fk_bookings_departure_id',
  })
  departure: Relation<TripDepartureEntity>;

  @Column({ name: 'traveler_count', type: 'integer' })
  travelerCount: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EBookingStatus,
    default: EBookingStatus.PENDING,
  })
  status: EBookingStatus;

  @Column({
    name: 'refund_status',
    type: 'enum',
    enum: EBookingRefundStatus,
    default: null,
  })
  refundStatus: EBookingRefundStatus | null;

  @Column({ name: 'currency', type: 'enum', enum: ECURRENCY })
  currency: ECURRENCY;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({
    name: 'refund_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: null,
  })
  refundAmount: string | null;

  @Column({
    name: 'payment_checkout_id',
    type: 'varchar',
    length: 40,
    default: null,
  })
  paymentCheckoutId: string | null;

  @Column({
    name: 'payment_reference_id',
    type: 'varchar',
    length: 40,
    default: null,
  })
  paymentReferenceId: string | null;

  @Column({
    name: 'payment_refund_id',
    type: 'varchar',
    length: 40,
    default: null,
  })
  paymentRefundId: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'error', type: 'text', default: null })
  error: string | null;

  @Column({ name: 'refund_reason', type: 'text', default: null })
  refundReason: string | null;

  @Column({ name: 'refunded_at', type: 'timestamptz', default: null })
  refundedAt: Date | null;

  @Column({ name: 'payment_method', type: 'text', default: null })
  paymentMethod: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', default: null })
  cancelledAt: Date | null;

  @Column({ name: 'cancellation_reason', type: 'text', default: null })
  cancellationReason: string | null;

  @Column({
    name: 'cancellation_fee',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: null,
  })
  cancellationFee: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => BookingTravelerEntity, (travelers) => travelers.booking)
  travelers: Relation<BookingTravelerEntity>[];
}
