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
import { TourEntity } from './tours.entity.js';
import type { TAsset } from '../schemas/misc.schema.js';

@Entity('tour_reviews')
@Unique('uq_tour_reviews_user_id_tour_id', ['userId', 'tourId'])
@Index('idx_tour_reviews_tour_id', ['tourId'])
@Check('chk_tour_reviews_rating', `"rating" BETWEEN 1 AND 5`)
export class TourReviewEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ name: 'user_id', type: 'varchar', length: 26, nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, (user) => user.reviews, { onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_tour_reviews_user_id',
  })
  user: Relation<UserEntity> | null;

  @Column({ name: 'tour_id', type: 'varchar', length: 26 })
  tourId: string;

  @ManyToOne(() => TourEntity, (tour) => tour.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'tour_id',
    foreignKeyConstraintName: 'fk_tour_reviews_tour_id',
  })
  tour: Relation<TourEntity>;

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
