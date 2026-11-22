import { PickType } from '@nestjs/swagger';
import { BookingTravelerEntity } from '../../entities/booking_travelers.entity.js';

export class BookingTravelerDto extends BookingTravelerEntity {}

export class CreateBookingTraveler extends PickType(BookingTravelerDto, [
  'bookingId',
  'travelerId',
]) {}
