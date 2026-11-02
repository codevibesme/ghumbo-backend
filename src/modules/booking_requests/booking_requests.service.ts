import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingRequestRepository } from './booking_requests.repository.js';
import {
  BookingRequestDto,
  CreateBookingRequestDto,
  UserBookingRequestDto,
} from './booking_requests.dto.js';
import { EntityManager } from 'typeorm';
import { PaginatedResponseDto, PaginationReqDto } from '../misc/dto.js';
import { TripDepartureService } from '../trip_departures/trip_departures.service.js';
import { ETripDepartureStatus } from '../../schemas/trip_departures.schema.js';

@Injectable()
export class BookingRequestService {
  constructor(
    private readonly departureService: TripDepartureService,
    private readonly repo: BookingRequestRepository,
  ) {}

  async create(
    data: CreateBookingRequestDto,
    txn: EntityManager | null,
  ): Promise<BookingRequestDto> {
    const departure = await this.departureService.findByIdAndStatusOrThrow(
      data.tripDepartureId,
      ETripDepartureStatus.OPEN,
    );

    if (departure.capacity <= departure.bookedSeats) {
      throw new ConflictException('Houseful');
    }

    const existingRequest = await this.repo.findByUserFingerPrint({
      userId: data.userId,
      email: data.email,
      tripDepartureId: data.tripDepartureId,
    });

    if (existingRequest) {
      throw new ConflictException(
        'The booking request already exists for these details',
      );
    }

    return await this.repo.create(data, txn);
  }

  async findUserBookings(
    userId: string,
    pageParams: PaginationReqDto,
  ): Promise<PaginatedResponseDto<UserBookingRequestDto>> {
    return await this.repo.findUserBookings(userId, pageParams);
  }

  async findByCode(
    userId: string,
    code: string,
  ): Promise<UserBookingRequestDto | null> {
    return await this.repo.findByUserIdAndCode(userId, code);
  }

  async findByCodeOrThrow(
    userId: string,
    code: string,
  ): Promise<UserBookingRequestDto> {
    const data = await this.findByCode(userId, code);
    if (!data) {
      throw new NotFoundException('Booking request not found');
    }

    return data;
  }

  async withdraw(userId: string, code: string): Promise<void> {
    await this.repo.withdraw(userId, code);
  }
}
