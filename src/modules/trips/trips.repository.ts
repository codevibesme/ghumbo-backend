import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripEntity } from '../../entities/trips.entity.js';
import { Repository } from 'typeorm';
import { TripDto, TripListItemDto, TripQueryDto } from './trips.dto.js';
import { PaginatedResponseDto } from '../misc/dto.js';
import { TripDepartureEntity } from '../../entities/trip_departures.entity.js';
import { TripDeparturePriceEntity } from '../../entities/trip_departure_prices.entity.js';
import { TripReviewEntity } from '../../entities/trip_reviews.entity.js';
import { ETripDepartureStatus } from '../../schemas/trip_departures.schema.js';
import { ETripDeparturePriceType } from '../../schemas/trip_departure_prices.schema.js';
import { ETripStatus } from '../../schemas/trips.schema.js';
import { ECURRENCY } from '../../schemas/misc.schema.js';

@Injectable()
export class TripRepository {
  constructor(
    @InjectRepository(TripEntity) private readonly repo: Repository<TripEntity>,
  ) {}

  async findByDestinationSlug(
    slug: string,
    query: TripQueryDto,
  ): Promise<PaginatedResponseDto<TripListItemDto>> {
    let page = query.page ?? 1;
    let size = query.size ?? 10;
    const currency = query.currency ?? ECURRENCY.INR;

    const qb = this.repo.createQueryBuilder('trip');

    // next bookable departure: open, not started yet, earliest first
    const nextDepartureId = qb
      .subQuery()
      .select('d.id')
      .from(TripDepartureEntity, 'd')
      .where('d.trip_id = trip.id')
      .andWhere('d.status = :openStatus')
      .andWhere('d.start_date >= CURRENT_DATE')
      .orderBy('d.start_date', 'ASC')
      .limit(1)
      .getQuery();

    qb.innerJoin('trip.destination', 'destination')
      .leftJoin(
        'trip.departures',
        'departure',
        `departure.id = ${nextDepartureId}`,
      )
      .select([
        'trip.id',
        'trip.name',
        'trip.slug',
        'trip.tier',
        'trip.durationDays',
        'trip.durationNights',
        'trip.assets',
        'destination.id',
        'destination.name',
        'destination.slug',
        'departure.id',
        'departure.startDate',
        'departure.endDate',
      ])
      .addSelect('departure.capacity - departure.booked_seats', 'seats_left')
      
      .addSelect(
        (sq) =>
          sq
            .select('MIN(p.amount)')
            .from(TripDeparturePriceEntity, 'p')
            .innerJoin('p.departure', 'pd')
            .where('pd.trip_id = trip.id')
            .andWhere('pd.status = :openStatus')
            .andWhere('pd.start_date >= CURRENT_DATE')
            .andWhere('p.type = :adultType')
            .andWhere('p.currency = :currency'),
        'starting_price',
      )
      .addSelect(
        (sq) =>
          sq
            .select('ROUND(AVG(r.rating)::numeric, 1)')
            .from(TripReviewEntity, 'r')
            .where('r.trip_id = trip.id'),
        'rating',
      )
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)')
            .from(TripReviewEntity, 'r')
            .where('r.trip_id = trip.id'),
        'review_count',
      )
      .where('destination.slug = :slug', { slug })
      .andWhere('trip.status = :liveStatus')
      .setParameters({
        openStatus: ETripDepartureStatus.OPEN,
        adultType: ETripDeparturePriceType.ADULT,
        liveStatus: ETripStatus.LIVE,
        currency,
      });

    
    const [{ entities, raw }, count] = await Promise.all([
      qb
        .clone()
        .orderBy('trip.createdAt', 'DESC')
        .addOrderBy('trip.id', 'DESC')
        .offset((page - 1) * size)
        .limit(size)
        .getRawAndEntities(),
      qb.clone().getCount(),
    ]);

    const rawMap = new Map(raw.map((row) => [row.trip_id, row]));

    const trips = entities.map(({ departures, assets, ...trip }) => {
      const row = rawMap.get(trip.id);
      const [departure] = departures ?? [];
      const [asset] = assets ?? [];

      return {
        ...trip,
        nextDeparture: departure
          ? { ...departure, seatsLeft: Number(row.seats_left) }
          : null,
        asset: asset ?? null,
        startingPrice:
          row.starting_price !== null
            ? { amount: Number(row.starting_price), currency }
            : null,
        rating: row.rating !== null ? Number(row.rating) : null,
        reviewCount: Number(row.review_count),
      };
    });

    return {
      page,
      size: trips.length,
      data: trips,
      total: count,
      hasNext: page * size < count,
      hasPrev: page > 1 && count > 0,
    };
  }

  async findBySlug(slug: string): Promise<TripDto | null> {
    return this.repo
      .createQueryBuilder('trip')
      .where('trip.slug = :slug', { slug })
      .getOne();
  }
}
