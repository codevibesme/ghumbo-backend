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
import { TourEntity } from './tours.entity.js';
import { TourDeparturePriceEntity } from './tour_departure_prices.entity.js';
import { BookingRequestEntity } from './booking_requests.entity.js';
import { ETourDepartureStatus } from '../types/tour_departures.type.js';

@Entity('tour_departures')
@Check('chk_tour_departures_capacity', `"capacity" > 0`)
@Check(
  'chk_tour_departures_booked_seats',
  `"booked_seats" >= 0 AND "booked_seats" <= "capacity"`,
)
@Check('chk_tour_departures_dates', `"end_date" >= "start_date"`)
export class TourDepartureEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Index('idx_tour_departures_tour_id')
  @Column({ name: 'tour_id', type: 'varchar', length: 26 })
  tourId: string;

  @ManyToOne(() => TourEntity, (tour) => tour.departures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'tour_id',
    foreignKeyConstraintName: 'fk_tour_departures_tour_id',
  })
  tour: Relation<TourEntity>;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ETourDepartureStatus,
    default: ETourDepartureStatus.DRAFT,
  })
  status: ETourDepartureStatus;

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

  @OneToMany(() => TourDeparturePriceEntity, (prices) => prices.departure)
  prices: TourDeparturePriceEntity[];

  @OneToMany(
    () => BookingRequestEntity,
    (bookingRequests) => bookingRequests.departure,
  )
  bookingRequests: BookingRequestEntity[];
}
