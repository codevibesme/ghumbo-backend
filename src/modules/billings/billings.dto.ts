import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  Matches,
} from 'class-validator';
import { ECURRENCY } from '../../schemas/misc.schema.js';

// Crockford base32, 26 chars (what `ulid` generates).
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// A plain class, not PickType(BookingDto): mapped types copy the entity's `id = ulid()` default,
// which would let a request without an id pass validation.
export class CreateBookingReqDto {
  // Client-generated, so a retried request can't create a second booking.
  @Matches(ULID, { message: 'id must be a ULID' })
  id: string;

  @Matches(ULID, { message: 'departureId must be a ULID' })
  departureId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ArrayUnique()
  @Matches(ULID, { each: true, message: 'each travelerId must be a ULID' })
  travelerIds: string[];
}

export class CreateBookingResDto {
  bookingId: string;
  orderId: string;
  amount: string;
  currency: ECURRENCY;
}
