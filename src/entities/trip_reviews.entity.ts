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
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { UserEntity } from './users.entity.js';
import { TripEntity } from './trips.entity.js';
import type { TAsset } from '../schemas/misc.schema.js';

@Entity('trip_reviews')
@Unique('uq_trip_reviews_user_id_trip_id', ['userId', 'tripId'])
@Index('idx_trip_reviews_trip_id', ['tripId'])
@Check('chk_trip_reviews_rating', `"rating" BETWEEN 1 AND 5`)
export class TripReviewEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ name: 'user_id', type: 'varchar', length: 26, nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, (user) => user.reviews, { onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_trip_reviews_user_id',
  })
  user: Relation<UserEntity> | null;

  @Column({ name: 'trip_id', type: 'varchar', length: 26 })
  tripId: string;

  @ManyToOne(() => TripEntity, (trip) => trip.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'trip_id',
    foreignKeyConstraintName: 'fk_trip_reviews_trip_id',
  })
  trip: Relation<TripEntity>;

  @Column({ name: 'rating', type: 'integer' })
  rating: number;

  @Column({ name: 'feedback', type: 'text', nullable: true })
  feedback: string | null;

  @Column({ name: 'assets', type: 'jsonb', default: () => "'[]'" })
  assets: TAsset[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
