import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TripReviewEntity } from "../../entities/trip_reviews.entity.js";
import { Repository } from "typeorm";
import { PaginatedResponseDto } from "../misc/dto.js";
import { TripReviewDto, TripReviewQueryDto } from "./trip_reviews.dto.js";

@Injectable()
export class TripReviewRepository {
    constructor(@InjectRepository(TripReviewEntity) private readonly repo: Repository<TripReviewEntity>) {}

    async findByTripId(tripId: string, query: TripReviewQueryDto): Promise<PaginatedResponseDto<TripReviewDto>> {
        let page = query.page ?? 1;
        let size = query.size ?? 10;

        const qb = this.repo.createQueryBuilder('review');
        qb.where('review.tripId = :tripId', { tripId })


        const [reviews, count] = await Promise.all([
            qb.clone().skip((page - 1) * size).take(size).getMany(),
            qb.clone().getCount()
        ]);

        return {
            data: reviews,
            total: count,
            page,
            size: reviews.length,
            hasNext: page * size < count,
            hasPrev: page > 1 && count > 0
        }
    }
}