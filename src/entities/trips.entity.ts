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
import type { TAsset } from '../schemas/misc.schema.js';
import {
  ETripAudience,
  ETripStatus,
  ETripTier,
  TTripTag,
  type TItinerary,
  type TTripInclusion,
} from '../schemas/trips.schema.js';
import { TripDepartureEntity } from './trip_departures.entity.js';
import { BookingRequestEntity } from './booking_requests.entity.js';
import { TripReviewEntity } from './trip_reviews.entity.js';

@Entity('trips')
@Unique('uq_trips_slug', ['slug'])
@Check('chk_trips_slug', `"slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`)
@Check(
  'chk_trips_duration',
  `"duration_days" > 0 AND "duration_nights" >= 0 AND "duration_nights" <= "duration_days"`,
)
export class TripEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Index('idx_trips_destination_id')
  @Column({ name: 'destination_id', type: 'integer' })
  destinationId: number;

  @ManyToOne(() => DestinationEntity, (destination) => destination.trips, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'destination_id',
    foreignKeyConstraintName: 'fk_trips_destination_id',
  })
  destination: Relation<DestinationEntity>;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ETripStatus,
    default: ETripStatus.DRAFT,
  })
  status: ETripStatus;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'slug', type: 'varchar', length: 255 })
  slug: string;

  @Column({ name: 'overview', type: 'text' })
  overview: string;

  @Column({ name: 'tier', type: 'enum', enum: ETripTier })
  tier: ETripTier;

  @Column({
    name: 'audience',
    type: 'enum',
    enum: ETripAudience,
    default: ETripAudience.OPEN,
  })
  audience: ETripAudience;

  @Column({ name: 'duration_days', type: 'integer' })
  durationDays: number;

  @Column({ name: 'duration_nights', type: 'integer' })
  durationNights: number;

  @Column({ name: 'tags', type: 'jsonb', default: () => "'[]'" })
  tags: TTripTag[];

  @Column({ name: 'itinerary', type: 'jsonb' })
  itinerary: TItinerary;

  @Column({ name: 'inclusions', type: 'jsonb', default: () => "'[]'" })
  inclusions: TTripInclusion[];

  @Column({ name: 'exclusions', type: 'jsonb', default: () => "'[]'" })
  exclusions: TTripInclusion[];

  @Column({ name: 'assets', type: 'jsonb', default: () => "'[]'" })
  assets: TAsset[];

  @Column({ name: 'is_recommended', type: 'boolean', default: false })
  isRecommended: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => TripDepartureEntity, (departures) => departures.trip)
  departures: TripDepartureEntity[];

  @OneToMany(
    () => BookingRequestEntity,
    (bookingRequests) => bookingRequests.trip,
  )
  bookingRequests: BookingRequestEntity[];

  @OneToMany(() => TripReviewEntity, (reviews) => reviews.trip)
  reviews: TripReviewEntity[];
}
