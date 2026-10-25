import { Injectable } from '@nestjs/common';
import { BookingRequestRepository } from './booking_requests.repository.js';
import {
  BookingRequestDto,
  CreateBookingRequestDto,
} from './booking_requests.dto.js';
import { EntityManager } from 'typeorm';

@Injectable()
export class BookingRequestService {
  constructor(private readonly repo: BookingRequestRepository) {}

  async create(
    data: CreateBookingRequestDto,
    txn: EntityManager | null,
  ): Promise<BookingRequestDto> {
    return await this.repo.create(data, txn);
  }
}
