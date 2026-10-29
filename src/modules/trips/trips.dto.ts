import {
  ApiPropertyOptional,
  IntersectionType,
  PickType,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TripEntity } from '../../entities/trips.entity.js';
import { DestinationDto } from '../destinations/destinations.dto.js';
import { ECURRENCY, TAsset } from '../../schemas/misc.schema.js';
import { TripDepartureDto } from '../trip_departures/trip_departures.dto.js';
import { PaginationReqDto } from '../misc/dto.js';
import { toStringArray } from '../../utilities/transformers.js';

export class TripDto extends TripEntity {}

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
  'isPeak',
  'startDate',
  'endDate',
]) {
  seatsLeft: number;
}

export class TripListItemDto extends PickType(TripDto, [
  'id',
  'name',
  'slug',
  'tags',
  'tier',
  'isRecommended',
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
  @ApiPropertyOptional({ enum: ECURRENCY, default: ECURRENCY.INR })
  @IsEnum(ECURRENCY)
  @IsOptional()
  currency?: ECURRENCY = ECURRENCY.INR;

  @ApiPropertyOptional({
    description: 'Destination slug',
    example: 'west-bengal',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  destination?: string;

  @ApiPropertyOptional({
    description: 'Search text',
    example: 'darjeeling',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  q?: string;
  @ApiPropertyOptional({
    description:
      'Tag labels (vibes). Matches trips with any of them. Repeat the param or comma-separate.',
    type: [String],
    example: ['Hills'],
  })
  @Transform(toStringArray)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
}

export class TripQueryDto extends IntersectionType(
  TripFiltersDto,
  PaginationReqDto,
) {}
