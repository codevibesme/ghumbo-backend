import { Controller, Get, Param, Res } from "@nestjs/common";
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import { TripDepartureService } from "./trip_departures.service.js";
import { DestinationDto } from "../destinations/destinations.dto.js";
import type { Response } from "express";

@Controller('departures')
@ApiTags('departures')
export class TripDepartureController {
    constructor(private readonly service: TripDepartureService){ }

  @Get('/trip/:tripId')
  @ApiOkResponse({ type: DestinationDto, isArray: true })
  @ApiParam({ name: 'tripId', type: 'string' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findAllByCountryName(
    @Res() res: Response,
    @Param('tripId') tripId: string,
  ) {
    const data = await this.service.findByTripId(tripId);

    return res.status(200).send(data);
  }    
}