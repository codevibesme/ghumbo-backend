import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BookingRequestEntity } from '../../entities/booking_requests.entity.js';
import { trim, trimLower } from '../../utilities/transformers.js';
import { PickType } from '@nestjs/swagger';
import { ECURRENCY, TAsset } from '../../schemas/misc.schema.js';

const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export class BookingRequestDto extends BookingRequestEntity {}

export class CreateBookingRequestReqDto {
  @Matches(ULID, { message: 'tripDepartureId must be a valid id' })
  tripDepartureId: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @Transform(trimLower)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Transform(trim)
  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(16)
  phone: string | null;

  @IsInt()
  @Min(1)
  @Max(18)
  travelerCount: number;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  query: string | null;
}

export class UserBookingFingerprint extends PickType(
  CreateBookingRequestReqDto,
  ['email', 'tripDepartureId'],
) {
  @IsOptional()
  userId: string | null;
}

export class CreateBookingRequestDto extends CreateBookingRequestReqDto {
  @IsOptional()
  userId: string | null;
}

export class UserBookingRequestDto extends PickType(BookingRequestDto, [
  'id',
  'tripDepartureId',
  'status',
  'statusNotes',
  'code',
  'firstName',
  'lastName',
  'email',
  'phone',
  'createdAt',
  'updatedAt',
  'travelerCount',
]) {
  tripName: string;
  /** For linking to the trip page. */
  tripSlug: string;
  /** The trip's cover photo (its first asset), for the My trips card. */
  tripAsset: TAsset | null;
  destinationName: string;
  isPeak: boolean;
  startDate: string;
  endDate: string;
  currency: ECURRENCY;
  estimate: string;
}
