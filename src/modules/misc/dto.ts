import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationReqDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform((params) =>
    typeof params.value === 'string' ? parseInt(params.value) : params.value,
  )
  page?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 50, default: 10 })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  @Transform((params) =>
    typeof params.value === 'string' ? parseInt(params.value) : params.value,
  )
  size?: number;
}

export class PaginatedResponseDto<T> {
  @IsArray()
  data: T[];

  @IsNumber()
  page: number;

  @IsNumber()
  size: number;

  @IsNumber()
  total: number;

  @IsBoolean()
  hasNext: boolean;

  @IsBoolean()
  hasPrev: boolean;
}
