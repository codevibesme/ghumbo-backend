import { Injectable } from "@nestjs/common";
import { TripDepartureRepository } from "./trip_departures.repository.js";
import { TripDepartureDto } from "./trip_departures.dto.js";

@Injectable()
export class TripDepartureService {
    constructor(private readonly repo: TripDepartureRepository) {}

    async findByTripId(tripId: string): Promise<TripDepartureDto[]> {
        return await this.repo.findByTripId(tripId)
    }
}