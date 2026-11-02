import { Injectable, NotFoundException } from '@nestjs/common';
import { TripDepartureRepository } from './trip_departures.repository.js';
import { TripDepartureDto } from './trip_departures.dto.js';
import { ETripDepartureStatus } from '../../schemas/trip_departures.schema.js';

@Injectable()
export class TripDepartureService {
  constructor(private readonly repo: TripDepartureRepository) {}

  async findByTripId(tripId: string): Promise<TripDepartureDto[]> {
    return await this.repo.findByTripId(tripId);
  }

  async findByIdAndStatus(
    id: string,
    status: ETripDepartureStatus,
  ): Promise<TripDepartureDto | null> {
    return await this.repo.findByIdAndStatus(id, status);
  }

  async findByIdAndStatusOrThrow(
    id: string,
    status: ETripDepartureStatus,
  ): Promise<TripDepartureDto> {
    const data = await this.findByIdAndStatus(id, status);
    if (!data) throw new NotFoundException('Trip departure not found');

    return data;
  }
}
