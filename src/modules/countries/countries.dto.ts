import { IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CountryEntity } from '../../entities/countries.entity.js';
import { ECountryStatus } from '../../schemas/countries.schema.js';
import { PaginationReqDto } from '../misc/dto.js';

export class CountryDto extends CountryEntity {}

export class CountryFiltersDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ECountryStatus)
  @IsOptional()
  status?: ECountryStatus;
}

export class CountryQueryDto extends IntersectionType(
  CountryFiltersDto,
  PaginationReqDto,
) {}
