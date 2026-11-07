import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripDepartureEntity } from '../../entities/trip_departures.entity.js';
import { Repository } from 'typeorm';
import { TripDepartureDto } from './trip_departures.dto.js';
import { ETripDepartureStatus } from '../../schemas/trip_departures.schema.js';
import { ETripStatus } from '../../schemas/trips.schema.js';
import { EDestinationStatus } from '../../schemas/destinations.schema.js';

@Injectable()
export class TripDepartureRepository {
  constructor(
    @InjectRepository(TripDepartureEntity)
    private readonly repo: Repository<TripDepartureEntity>,
  ) {}

  async findByTripId(tripId: string): Promise<TripDepartureDto[]> {
    return await this.repo
      .createQueryBuilder('departure')
      .where('departure.tripId = :tripId', { tripId })
      .andWhere('departure.status = :status', {
        status: ETripDepartureStatus.OPEN,
      })
      .getMany();
  }

  async findByIdAndStatus(
    id: string,
    status: ETripDepartureStatus,
  ): Promise<TripDepartureDto | null> {
    return await this.repo.findOneBy({ id, status });
  }

  async findUpcoming(): Promise<TripDepartureDto[]> {
    return await this.repo
      .createQueryBuilder('departure')
      .innerJoin('departure.trip', 'trip')
      .innerJoin('trip.destination', 'destination')
      .select([
        'departure.id',
        'departure.tripId',
        'departure.status',
        'departure.isPeak',
        'departure.startDate',
        'departure.endDate',
        'departure.capacity',
        'departure.bookedSeats',
        'departure.currency',
        'departure.amount',
        'trip.id',
        'trip.name',
        'trip.slug',
        'trip.status',
        'trip.durationDays',
        'destination.slug',
        'destination.name',
        'destination.status',
      ])
      .where('departure.status = :open', { open: ETripDepartureStatus.OPEN })
      .andWhere('departure.startDate >= CURRENT_DATE')
      .andWhere('trip.status = :live', { live: ETripStatus.LIVE })
      .andWhere('destination.status = :liveDest', {
        liveDest: EDestinationStatus.LIVE,
      })
      .orderBy('departure.startDate', 'ASC')
      .addOrderBy('trip.name', 'ASC')
      .take(10)
      .getMany();
  }
}
