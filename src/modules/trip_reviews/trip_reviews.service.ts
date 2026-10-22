import { Injectable } from "@nestjs/common";
import { TripReviewRepository } from "./trip_reviews.repository.js";
import { TripQueryDto } from "../trips/trips.dto.js";
import { PaginatedResponseDto } from "../misc/dto.js";
import { TripReviewDto } from "./trip_reviews.dto.js";

@Injectable()
export class TripReviewService {
    constructor(private readonly repo: TripReviewRepository) {}

    async findByTripId(tripId: string, query: TripQueryDto): Promise<PaginatedResponseDto<TripReviewDto>> {
        return await this.repo.findByTripId(tripId, query);
    }
}