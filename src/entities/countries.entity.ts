import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DestinationEntity } from './destinations.entity.js';
import type { TAsset } from '../schemas/misc.schema.js';
import { ECountryStatus } from '../schemas/countries.schema.js';

@Entity('countries')
@Check('chk_countries_code_upper', `"code" = upper("code")`)
@Check('chk_countries_latitude', `"latitude" BETWEEN -90 AND 90`)
@Check('chk_countries_longitude', `"longitude" BETWEEN -180 AND 180`)
export class CountryEntity {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ECountryStatus,
    default: ECountryStatus.COMING_SOON,
  })
  status: ECountryStatus;

  @Column({ name: 'name', type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ name: 'code', type: 'char', length: 2, unique: true })
  code: string;

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

  @OneToMany(() => DestinationEntity, (destination) => destination.country)
  destinations: DestinationEntity[];
}
