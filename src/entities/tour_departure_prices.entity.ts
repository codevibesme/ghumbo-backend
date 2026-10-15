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
import { TourDepartureEntity } from './tour_departures.entity.js';
import { ETourDeparturePriceType } from '../schemas/tour_departure_prices.schema.js';

@Entity('tour_departure_prices')
@Unique('uq_tour_departure_prices_departure_type_currency', [
  'departureId',
  'type',
  'currency',
])
@Check('chk_tour_departure_prices_amount', `"amount" >= 0`)
export class TourDeparturePriceEntity {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ name: 'departure_id', type: 'varchar', length: 26 })
  departureId: string;

  @ManyToOne(() => TourDepartureEntity, (departure) => departure.prices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'departure_id',
    foreignKeyConstraintName: 'fk_tour_departure_prices_departure_id',
  })
  departure: Relation<TourDepartureEntity>;

  @Column({ name: 'type', type: 'enum', enum: ETourDeparturePriceType })
  type: ETourDeparturePriceType;

  @Column({ name: 'currency', type: 'enum', enum: ECURRENCY })
  currency: ECURRENCY;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
