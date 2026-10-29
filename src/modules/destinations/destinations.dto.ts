import { IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DestinationEntity } from '../../entities/destinations.entity.js';
import { EDestinationStatus } from '../../schemas/destinations.schema.js';
import { PaginationReqDto } from '../misc/dto.js';

export class DestinationDto extends DestinationEntity {}

export class DestinationFiltersDto {
  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber()
  @IsOptional()
  countryId?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(EDestinationStatus)
  @IsOptional()
  status?: EDestinationStatus;
}

export class DestinationQueryDto extends IntersectionType(
  DestinationFiltersDto,
  PaginationReqDto,
) {}
