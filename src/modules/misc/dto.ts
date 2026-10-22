import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationReqDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform((params) =>
    typeof params.value === 'string' ? parseInt(params.value) : params.value,
  )
  page?: number;

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
