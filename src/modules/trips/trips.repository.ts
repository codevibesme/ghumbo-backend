import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripEntity } from '../../entities/trips.entity.js';
import { Brackets, Repository } from 'typeorm';
import { TripDto, TripListItemDto, TripQueryDto } from './trips.dto.js';
import { PaginatedResponseDto } from '../misc/dto.js';
import { TripDepartureEntity } from '../../entities/trip_departures.entity.js';
import { TripReviewEntity } from '../../entities/trip_reviews.entity.js';
import { ETripDepartureStatus } from '../../schemas/trip_departures.schema.js';
import { ETripStatus } from '../../schemas/trips.schema.js';
import { ECURRENCY } from '../../schemas/misc.schema.js';

@Injectable()
export class TripRepository {
  constructor(
    @InjectRepository(TripEntity) private readonly repo: Repository<TripEntity>,
  ) {}

  async findAll(
    query: TripQueryDto,
  ): Promise<PaginatedResponseDto<TripListItemDto>> {
    let page = query.page ?? 1;
    let size = query.size ?? 10;
    const currency = query.currency ?? ECURRENCY.INR;
    const destinationSlug = query.destination || null;

    const q = query.q?.trim() || null;
    const tags = query.tags?.length ? query.tags : null;

    const qb = this.repo.createQueryBuilder('trip');

    // next bookable departure: open, not started yet, earliest first
    const nextDepartureId = qb
      .subQuery()
      .select('d.id')
      .from(TripDepartureEntity, 'd')
      .where('d.tripId = trip.id')
      .andWhere('d.status = :openStatus')
      .andWhere('d.startDate >= CURRENT_DATE')
      .orderBy('d.startDate', 'ASC')
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
        'trip.tags',
        'trip.isRecommended',
        'trip.tier',
        'trip.durationDays',
        'trip.durationNights',
        'trip.assets',
        'destination.id',
        'destination.name',
        'destination.slug',
        'departure.id',
        'departure.isPeak',
        'departure.startDate',
        'departure.endDate',
      ])
      .addSelect('departure.capacity - departure.bookedSeats', 'seats_left')
      .addSelect(
        (sq) =>
          sq
            .select('MIN(pd.amount)')
            .from(TripDepartureEntity, 'pd')
            .where('pd.tripId = trip.id')
            .andWhere('pd.status = :openStatus')
            .andWhere('pd.startDate >= CURRENT_DATE'),
        'starting_price',
      )
      .addSelect(
        (sq) =>
          sq
            .select('ROUND(AVG(r.rating)::numeric, 1)')
            .from(TripReviewEntity, 'r')
            .where('r.tripId = trip.id'),
        'rating',
      )
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)')
            .from(TripReviewEntity, 'r')
            .where('r.tripId = trip.id'),
        'review_count',
      );

    if (destinationSlug) {
      qb.where('destination.slug = :slug', {
        slug: decodeURIComponent(destinationSlug),
      });
    }

    if (q) {
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('trip.name ILIKE :q')
            .orWhere('trip.overview ILIKE :q')
            .orWhere('destination.name ILIKE :q')
            .orWhere('trip.tags::text ILIKE :q'),
        ),
        { q: `%${q.replace(/[%_\\]/g, '\\$&')}%` },
      );
    }

    if (tags) {
      // any of the labels; jsonb containment per label
      qb.andWhere('trip.tags @> ANY(:tagFilters::jsonb[])', {
        tagFilters: tags.map((label) => JSON.stringify([{ label }])),
      });
    }

    qb.andWhere('trip.status = :liveStatus').setParameters({
      openStatus: ETripDepartureStatus.OPEN,
      liveStatus: ETripStatus.LIVE,
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
      .leftJoinAndSelect('trip.destination', 'destination')
      .where('trip.slug = :slug', { slug })
      .andWhere('trip.status = :status', { status: ETripStatus.LIVE })
      .getOne();
  }
}
