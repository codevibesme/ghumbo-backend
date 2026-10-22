import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TripReviewEntity } from "../../entities/trip_reviews.entity.js";
import { TripReviewService } from "./trip_reviews.service.js";
import { TripReviewRepository } from "./trip_reviews.repository.js";
import { TripReviewController } from "./trip_reviews.controller.js";

@Module({
    imports: [
        TypeOrmModule.forFeature([TripReviewEntity])
    ],
    controllers: [TripReviewController],
    providers: [TripReviewService, TripReviewRepository],
    exports: [TripReviewService]
})
export class TripReviewModule {}