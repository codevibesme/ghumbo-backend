import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripDepartureEntity } from '../../entities/trip_departures.entity.js';
import { Repository } from 'typeorm';
import { TripDepartureDto } from './trip_departures.dto.js';
import { ETripDepartureStatus } from '../../schemas/trip_departures.schema.js';

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
}
