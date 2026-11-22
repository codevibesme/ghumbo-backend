import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BookingTravelerEntity } from '../../entities/booking_travelers.entity.js';
import {
  BookingTravelerDto,
  CreateBookingTraveler,
} from './booking_travelers.dto.js';

@Injectable()
export class BookingTravelerRepository {
  constructor(
    @InjectRepository(BookingTravelerEntity)
    private readonly repo: Repository<BookingTravelerEntity>,
  ) {}

  async create(
    record: CreateBookingTraveler,
    txn: EntityManager | null,
  ): Promise<BookingTravelerDto> {
    const data = this.repo.create(record);
    if (txn) {
      return await txn.save(data);
    }

    return await this.repo.save(data);
  }

  async delete(id: string, txn: EntityManager | null) {
    if (txn) {
      return await txn.delete(BookingTravelerEntity, { id });
    }

    return await this.repo.delete(id);
  }
}
