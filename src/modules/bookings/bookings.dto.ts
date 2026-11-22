import { OmitType, PickType } from '@nestjs/swagger';
import { BookingEntity } from '../../entities/bookings.entity.js';
import { TAsset } from '../../schemas/misc.schema.js';
import { TravelerDetailsDto } from '../travelers/travelers.dto.js';

export class BookingDto extends BookingEntity {}

export class CreateBookingDto extends OmitType(BookingDto, [
  'createdAt',
  'updatedAt',
  'travelers',
  'paymentMethod',
  'refundStatus',
  'refundAmount',
  'paymentRefundId',
  'refundReason',
  'refundedAt',
  'cancellationReason',
  'cancellationFee',
  'cancelledAt',
  'user',
  'departure',
  'code',
]) {}

export class UserBookingDto extends PickType(BookingDto, [
  'id',
  'code',
  'departureId',
  'paymentCheckoutId',
  'paymentReferenceId',
  'paymentMethod',
  'travelerCount',
  'status',
  'refundStatus',
  'currency',
  'amount',
  'refundAmount',
  'expiresAt',
  'error',
  'refundReason',
  'refundedAt',
  'cancellationReason',
  'cancellationFee',
  'cancelledAt',
  'createdAt',
  'updatedAt',
]) {
  tripName: string;
  tripSlug: string;
  tripAsset: TAsset | null;
  destinationName: string;
  isPeak: boolean;
  startDate: string;
  endDate: string;
  travelers: TravelerDetailsDto[];
}
