import { IntersectionType } from "@nestjs/swagger";
import { TripReviewEntity } from "../../entities/trip_reviews.entity.js";
import { PaginationReqDto } from "../misc/dto.js";

export class TripReviewDto extends TripReviewEntity {}

export class TripReviewQueryDto extends IntersectionType(PaginationReqDto) {}