import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TravelerRepository } from './travelers.repository.js';
import { CreateTravelerDto, TravelerDto } from './travelers.dto.js';
import { EntityManager } from 'typeorm';

@Injectable()
export class TravelerService {
  constructor(private readonly repo: TravelerRepository) {}

  async create(
    record: CreateTravelerDto,
    txn: EntityManager | null,
  ): Promise<TravelerDto> {
    return await this.repo.create(record, txn);
  }

  async getByUserId(userId: string): Promise<TravelerDto[]> {
    return await this.repo.getByUserId(userId);
  }

  async delete(
    id: string,
    userId: string,
    txn: EntityManager | null,
  ): Promise<void> {
    const traveler = await this.repo.getByIdAndUserId(id, userId);
    if (!traveler) {
      throw new NotFoundException('Traveler not found');
    }

    const res = await this.repo.delete(id, txn);
    if (res?.affected === 0) {
      throw new ConflictException('Traveler has already been deleted');
    }
  }
}
