import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  BookingTravelerDto,
  CreateBookingTraveler,
} from './booking_travelers.dto.js';
import { BookingTravelerRepository } from './booking_travelers.repository.js';

@Injectable()
export class BookingTravelerService {
  constructor(private readonly repo: BookingTravelerRepository) {}

  async create(
    record: CreateBookingTraveler,
    txn: EntityManager | null,
  ): Promise<BookingTravelerDto> {
    return await this.repo.create(record, txn);
  }

  async delete(id: string, txn: EntityManager | null): Promise<void> {
    const res = await this.repo.delete(id, txn);
    if (res?.affected === 0) {
      throw new ConflictException('Booking traveler already unlinked');
    }
  }
}
