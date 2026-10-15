import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { ulid } from 'ulid';
import { BookingEntity } from './bookings.entity.js';
import { EBookingPaymentType } from '../schemas/booking_payments.schema.js';

@Entity('booking_payments')
@Check('chk_booking_payments_amount', `"amount" > 0`)
export class BookingPaymentEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Index('idx_booking_payments_booking_id')
  @Column({ name: 'booking_id', type: 'varchar', length: 26 })
  bookingId: string;

  @ManyToOne(() => BookingEntity, (booking) => booking.payments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'booking_id',
    foreignKeyConstraintName: 'fk_booking_payments_booking_id',
  })
  booking: Relation<BookingEntity>;

  @Column({ name: 'type', type: 'enum', enum: EBookingPaymentType })
  type: EBookingPaymentType;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
