import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { CountryEntity } from './countries.entity.js';
import { TripEntity } from './trips.entity.js';
import type { TAsset } from '../schemas/misc.schema.js';
import { EDestinationStatus } from '../schemas/destinations.schema.js';

@Entity('destinations')
@Unique('uq_destinations_slug', ['slug'])
@Check('chk_destinations_slug', `"slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`)
@Check('chk_destinations_latitude', `"latitude" BETWEEN -90 AND 90`)
@Check('chk_destinations_longitude', `"longitude" BETWEEN -180 AND 180`)
export class DestinationEntity {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Index('idx_destinations_country_id')
  @Column({ name: 'country_id', type: 'integer' })
  countryId: number;

  @ManyToOne(() => CountryEntity, (country) => country.destinations, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'country_id',
    foreignKeyConstraintName: 'fk_destinations_country_id',
  })
  country: Relation<CountryEntity>;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EDestinationStatus,
    default: EDestinationStatus.COMING_SOON,
  })
  status: EDestinationStatus;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'slug', type: 'varchar', length: 255 })
  slug: string;

  @Column({ name: 'overview', type: 'text' })
  overview: string;

  @Column({ name: 'latitude', type: 'double precision' })
  latitude: number;

  @Column({ name: 'longitude', type: 'double precision' })
  longitude: number;

  @Column({ name: 'assets', type: 'jsonb', default: () => "'[]'" })
  assets: TAsset[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => TripEntity, (trips) => trips.destination)
  trips: TripEntity[];
}
