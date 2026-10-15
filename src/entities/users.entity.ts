import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ulid } from 'ulid';
import { EUserRole } from '../schemas/users.schema.js';
import { AuthSessionEntity } from './auth_sessions.entity.js';
import { BookingRequestEntity } from './booking_requests.entity.js';
import type { TAsset } from '../schemas/misc.schema.js';
import { AuthIdentityEntity } from './auth_identities.entity.js';
import { TourReviewEntity } from './tour_reviews.entity.js';
import { TravelerEntity } from './travelers.entity.js';
import { BookingEntity } from './bookings.entity.js';

@Entity('users')
export class UserEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ name: 'name', type: 'varchar', length: 50 })
  name: string;

  @Column({ name: 'email', type: 'citext', unique: true, nullable: true })
  email: string | null;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 16,
    unique: true,
    nullable: true,
  })
  phone: string | null;

  @Column({
    name: 'role',
    type: 'enum',
    enum: EUserRole,
    default: EUserRole.CUSTOMER,
  })
  role: EUserRole;

  @Column({ name: 'photo', type: 'jsonb', nullable: true })
  photo: TAsset | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => AuthIdentityEntity, (identities) => identities.user)
  identities: AuthIdentityEntity[];

  @OneToMany(() => AuthSessionEntity, (sessions) => sessions.user)
  sessions: AuthSessionEntity[];

  @OneToMany(
    () => BookingRequestEntity,
    (bookingRequests) => bookingRequests.user,
  )
  bookingRequests: BookingRequestEntity[];

  @OneToMany(() => TourReviewEntity, (reviews) => reviews.user)
  reviews: TourReviewEntity[];

  @OneToMany(() => TravelerEntity, (travelers) => travelers.user)
  travelers: TravelerEntity[];

  @OneToMany(() => BookingEntity, (bookings) => bookings.user)
  bookings: BookingEntity[];
}
