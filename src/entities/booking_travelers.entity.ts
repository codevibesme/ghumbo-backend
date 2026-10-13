import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { BookingEntity } from './bookings.entity.js';
import { TravelerEntity } from './travelers.entity.js';

@Entity('booking_travelers')
export class BookingTravelerEntity {
  @PrimaryColumn({ name: 'booking_id', type: 'varchar', length: 26 })
  bookingId: string;

  @Index('idx_booking_travelers_traveler_id')
  @PrimaryColumn({ name: 'traveler_id', type: 'varchar', length: 26 })
  travelerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => BookingEntity, (booking) => booking.travelers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'booking_id',
    foreignKeyConstraintName: 'fk_booking_travelers_booking_id',
  })
  booking: Relation<BookingEntity>;

  @ManyToOne(() => TravelerEntity, (traveler) => traveler.bookingTravelers, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'traveler_id',
    foreignKeyConstraintName: 'fk_booking_travelers_traveler_id',
  })
  traveler: Relation<TravelerEntity>;
}
