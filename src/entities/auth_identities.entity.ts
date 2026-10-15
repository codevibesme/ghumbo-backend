import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { EAuthIdentityProvider } from '../schemas/auth_identities.schema.js';
import { UserEntity } from './users.entity.js';

@Entity('auth_identities')
@Unique('uq_auth_identities_user_id_provider', ['userId', 'provider'])
@Unique('uq_auth_identities_provider_provider_user_id', [
  'provider',
  'providerUserId',
])
export class AuthIdentityEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ name: 'user_id', type: 'varchar', length: 26 })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.identities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_auth_identities_user_id',
  })
  user: Relation<UserEntity>;

  @Column({ name: 'provider', type: 'enum', enum: EAuthIdentityProvider })
  provider: EAuthIdentityProvider;

  @Column({ name: 'provider_user_id', type: 'varchar', length: 255 })
  providerUserId: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordHash: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
