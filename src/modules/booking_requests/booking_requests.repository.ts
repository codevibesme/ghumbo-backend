import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookingRequestEntity } from '../../entities/booking_requests.entity.js';
import { EntityManager, Repository } from 'typeorm';
import {
  BookingRequestDto,
  CreateBookingRequestDto,
} from './booking_requests.dto.js';

@Injectable()
export class BookingRequestRepository {
  constructor(
    @InjectRepository(BookingRequestEntity)
    private readonly repo: Repository<BookingRequestEntity>,
  ) {}

  async create(
    data: CreateBookingRequestDto,
    txn: EntityManager | null,
  ): Promise<BookingRequestDto> {
    const record = this.repo.create(data);

    if (txn) {
      return await txn.save(record);
    }

    return await this.repo.save(record);
  }
}
