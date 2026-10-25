import { Transform } from 'class-transformer';
import {
  IsDateString,
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
  ValidateIf,
} from 'class-validator';
import { BookingRequestEntity } from '../../entities/booking_requests.entity.js';
import { trim, trimLower } from '../../utilities/transformers.js';

const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class BookingRequestDto extends BookingRequestEntity {}

/**
 * Public seat request. `userId` and `status` are set by the server, never the
 * client. Either a departure or a preferred travel date is required ("I'm
 * flexible" sends only the date).
 */
export class CreateBookingRequestDto {
  @Matches(ULID, { message: 'tripId must be a valid id' })
  tripId: string;

  @ValidateIf((o: CreateBookingRequestDto) => !o.travelDate)
  @Matches(ULID, { message: 'tripDepartureId must be a valid id' })
  tripDepartureId: string | null;

  @ValidateIf((o: CreateBookingRequestDto) => !o.tripDepartureId)
  @Matches(DATE_ONLY, { message: 'travelDate must be YYYY-MM-DD' })
  @IsDateString({ strict: true })
  travelDate: string | null;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

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
