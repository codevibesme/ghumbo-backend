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
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { DestinationEntity } from './destinations.entity.js';
import type { TAsset } from '../types/misc.type.js';
import {
  ETourStatus,
  ETourTier,
  type TItinerary,
  type TTourInclusion,
} from '../types/tours.type.js';
import { TourDepartureEntity } from './tour_departures.entity.js';
import { BookingRequestEntity } from './booking_requests.entity.js';
import { TourReviewEntity } from './tour_reviews.entity.js';

@Entity('tours')
@Unique('uq_tours_slug', ['slug'])
@Check('chk_tours_slug', `"slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`)
@Check(
  'chk_tours_duration',
  `"duration_days" > 0 AND "duration_nights" >= 0 AND "duration_nights" <= "duration_days"`,
)
export class TourEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Index('idx_tours_destination_id')
  @Column({ name: 'destination_id', type: 'integer' })
  destinationId: number;

  @ManyToOne(() => DestinationEntity, (destination) => destination.tours, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'destination_id',
    foreignKeyConstraintName: 'fk_tours_destination_id',
  })
  destination: Relation<DestinationEntity>;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ETourStatus,
    default: ETourStatus.DRAFT,
  })
  status: ETourStatus;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'slug', type: 'varchar', length: 255 })
  slug: string;

  @Column({ name: 'overview', type: 'text' })
  overview: string;

  @Column({ name: 'tier', type: 'enum', enum: ETourTier })
  tier: ETourTier;

  @Column({ name: 'duration_days', type: 'integer' })
  durationDays: number;

  @Column({ name: 'duration_nights', type: 'integer' })
  durationNights: number;

  @Column({ name: 'itinerary', type: 'jsonb' })
  itinerary: TItinerary;

  @Column({ name: 'inclusions', type: 'jsonb', default: () => "'[]'" })
  inclusions: TTourInclusion[];

  @Column({ name: 'exclusions', type: 'jsonb', default: () => "'[]'" })
  exclusions: TTourInclusion[];

  @Column({ name: 'assets', type: 'jsonb', default: () => "'[]'" })
  assets: TAsset[];

  @Column({ name: 'is_recommended', type: 'boolean', default: false })
  isRecommended: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => TourDepartureEntity, (departures) => departures.tour)
  departures: TourDepartureEntity[];

  @OneToMany(
    () => BookingRequestEntity,
    (bookingRequests) => bookingRequests.tour,
  )
  bookingRequests: BookingRequestEntity[];

  @OneToMany(() => TourReviewEntity, (reviews) => reviews.tour)
  reviews: TourReviewEntity[];
}
