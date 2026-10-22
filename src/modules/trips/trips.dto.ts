import { IntersectionType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TripEntity } from '../../entities/trips.entity.js';
import { DestinationDto } from '../destinations/destinations.dto.js';
import { ECURRENCY, TAsset } from '../../schemas/misc.schema.js';
import { TripDepartureDto } from '../trip_departures/trip_departures.dto.js';
import { PaginationReqDto } from '../misc/dto.js';

export class TripDto extends TripEntity {}
/*
{
    "id": "01M56JSF630W941JTTZKENVH8R",
    "destination": {
      "id": 1,
      "name": "West Bengal",
      "slug": "west-bengal"
    },
    "name": "Darjeeling: Queen of the Hills",
    "slug": "darjeeling-queen-of-the-hills-budget",
    "tier": "budget",
    "durationDays": 4,
    "durationNights": 3,
    "nextDeparture": {
      "id": "01M56JSF68MJRKGA34QTD9TFD8",
      "startDate": "2026-11-13",
      "endDate": "2026-11-16",
      "seatsLeft": 18
    },
    "asset": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/View_of_the_Himalayas_and_the_Kanchenjunga%2C_from_Tiger_Hill%2C_Darjeeling.jpg/1920px-View_of_the_Himalayas_and_the_Kanchenjunga%2C_from_Tiger_Hill%2C_Darjeeling.jpg",
      "type": "image",
      "label": "Kanchenjunga from Tiger Hill",
      "sort_order": 0,
      "description": "Kanchenjunga and the eastern Himalaya at sunrise from Tiger Hill, with Darjeeling on the ridge below. Photo: Judith, CC BY 2.0, via Wikimedia Commons",
      "thumbnail_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/View_of_the_Himalayas_and_the_Kanchenjunga%2C_from_Tiger_Hill%2C_Darjeeling.jpg/500px-View_of_the_Himalayas_and_the_Kanchenjunga%2C_from_Tiger_Hill%2C_Darjeeling.jpg"
    },
    "startingPrice": {
      "amount": 7799,
      "currency": "inr"
    },
    "rating": null,
    "reviewCount": 0
  }
*/

export class TripDestination extends PickType(DestinationDto, [
  'id',
  'name',
  'slug',
]) {}

export class TripStartingPriceDto {
  amount: number;
  currency: ECURRENCY;
}

export class TripNextDepartureDto extends PickType(TripDepartureDto, [
  'id',
  'startDate',
  'endDate',
]) {
  seatsLeft: number;
}

export class TripListItemDto extends PickType(TripDto, [
  'id',
  'name',
  'slug',
  'tier',
  'durationDays',
  'durationNights',
]) {
  destination: TripDestination | null;
  nextDeparture: TripNextDepartureDto | null;
  asset: TAsset | null;
  startingPrice: TripStartingPriceDto | null;
  rating: number | null;
  reviewCount: number;
}

export class TripFiltersDto {
  @IsEnum(ECURRENCY)
  @IsOptional()
  currency?: ECURRENCY = ECURRENCY.INR;
}

export class TripQueryDto extends IntersectionType(
  TripFiltersDto,
  PaginationReqDto,
) {}
