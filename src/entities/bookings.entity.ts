import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { EBookingStatus } from '../types/bookings.type.js';
import { ECURRENCY } from '../types/misc.type.js';
import { generateBookingCode } from '../utilities/codes/codes.js';
import { BookingRequestEntity } from './booking_requests.entity.js';
import { UserEntity } from './users.entity.js';
import { TourDepartureEntity } from './tour_departures.entity.js';
import { BookingTravelerEntity } from './booking_travelers.entity.js';
import { BookingPaymentEntity } from './booking_payments.entity.js';

@Entity('bookings')
@Index('idx_bookings_departure_id_status', ['departureId', 'status'])
@Check('chk_bookings_traveler_count', `"traveler_count" > 0`)
@Check('chk_bookings_amount', `"amount" >= 0`)
@Check(
  'chk_bookings_balance_due',
  `"balance_due" >= 0 AND "balance_due" <= "amount"`,
)
export class BookingEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ name: 'code', type: 'varchar', length: 9, unique: true })
  code: string = generateBookingCode();

  @Column({ name: 'request_id', type: 'varchar', length: 26, nullable: true })
  requestId: string | null;

  @OneToOne(() => BookingRequestEntity, (request) => request.booking, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'request_id',
    foreignKeyConstraintName: 'fk_bookings_request_id',
  })
  request: Relation<BookingRequestEntity> | null;

  @Index('idx_bookings_user_id')
  @Column({ name: 'user_id', type: 'varchar', length: 26, nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, (user) => user.bookings, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_bookings_user_id',
  })
  user: Relation<UserEntity> | null;

  @Column({ name: 'departure_id', type: 'varchar', length: 26, nullable: true })
  departureId: string | null;

  @ManyToOne(() => TourDepartureEntity, (departure) => departure.bookings, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({
    name: 'departure_id',
    foreignKeyConstraintName: 'fk_bookings_departure_id',
  })
  departure: Relation<TourDepartureEntity> | null;

  @Column({ name: 'traveler_count', type: 'integer' })
  travelerCount: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EBookingStatus,
    default: EBookingStatus.PENDING_PAYMENT,
  })
  status: EBookingStatus;

  @Column({ name: 'currency', type: 'enum', enum: ECURRENCY })
  currency: ECURRENCY;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ name: 'balance_due', type: 'numeric', precision: 12, scale: 2 })
  balanceDue: string;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @Column({
    name: 'cancelled_at',
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  cancelledAt: Date | null;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => BookingTravelerEntity, (travelers) => travelers.booking)
  travelers: Relation<BookingTravelerEntity>[];

  @OneToMany(() => BookingPaymentEntity, (payments) => payments.booking)
  payments: Relation<BookingPaymentEntity>[];
}
