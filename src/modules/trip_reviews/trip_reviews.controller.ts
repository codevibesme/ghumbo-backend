import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import { ApiBadRequestResponse, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import { TripReviewService } from "./trip_reviews.service.js";
import { PaginatedResponseDto } from "../misc/dto.js";
import { TripReviewDto, TripReviewQueryDto } from "./trip_reviews.dto.js";
import type { Response } from "express";

@Controller('reviews')
@ApiTags('reviews')
export class TripReviewController {
  constructor(private readonly service: TripReviewService) {}

@Get('/trip/:tripId')
  @ApiOkResponse({ type: PaginatedResponseDto<TripReviewDto> })
  @ApiParam({ name: 'tripId', type: 'string' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async findAllByCountryName(
    @Res() res: Response,
    @Param('tripId') tripId: string,
    @Query() query: TripReviewQueryDto,
  ) {
    const data = await this.service.findByTripId(tripId, query);

    return res.status(200).send(data);
  }
}