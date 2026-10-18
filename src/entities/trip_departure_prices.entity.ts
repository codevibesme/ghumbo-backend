import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { ECURRENCY } from '../schemas/misc.schema.js';
import { TripDepartureEntity } from './trip_departures.entity.js';
import { ETripDeparturePriceType } from '../schemas/trip_departure_prices.schema.js';

@Entity('trip_departure_prices')
@Unique('uq_trip_departure_prices_departure_type_currency', [
  'departureId',
  'type',
  'currency',
])
@Check('chk_trip_departure_prices_amount', `"amount" >= 0`)
export class TripDeparturePriceEntity {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ name: 'departure_id', type: 'varchar', length: 26 })
  departureId: string;

  @ManyToOne(() => TripDepartureEntity, (departure) => departure.prices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'departure_id',
    foreignKeyConstraintName: 'fk_trip_departure_prices_departure_id',
  })
  departure: Relation<TripDepartureEntity>;

  @Column({ name: 'type', type: 'enum', enum: ETripDeparturePriceType })
  type: ETripDeparturePriceType;

  @Column({ name: 'currency', type: 'enum', enum: ECURRENCY })
  currency: ECURRENCY;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
