import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { ETravelerGender } from '../types/travelers.type.js';
import { UserEntity } from './users.entity.js';

@Entity('travelers')
@Index('uq_travelers_user_id_is_self', ['userId'], {
  unique: true,
  where: `"is_self" = true AND "deleted_at" IS NULL`,
})
export class TravelerEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 26 })
  id: string = ulid();

  @Index('idx_travelers_user_id')
  @Column({ name: 'user_id', type: 'varchar', length: 26, nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, (user) => user.travelers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_travelers_user_id',
  })
  user: Relation<UserEntity> | null;

  @Column({ name: 'is_self', type: 'boolean', default: false })
  isSelf: boolean;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string;

  @Column({ name: 'gender', type: 'enum', enum: ETravelerGender })
  gender: ETravelerGender;

  @Index('idx_travelers_phone')
  @Column({ name: 'phone', type: 'varchar', length: 16, nullable: true })
  phone: string | null;

  @Column({ name: 'email', type: 'citext', nullable: true })
  email: string | null;

  @Column({
    name: 'emergency_contact_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  emergencyContactName: string | null;

  @Column({
    name: 'emergency_contact_phone',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  emergencyContactPhone: string | null;

  @Column({ name: 'dietary_notes', type: 'text', nullable: true })
  dietaryNotes: string | null;

  @Column({ name: 'medical_notes', type: 'text', nullable: true })
  medicalNotes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
