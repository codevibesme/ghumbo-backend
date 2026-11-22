import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TravelerEntity } from '../../entities/travelers.entity.js';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { CreateTravelerDto, TravelerDto } from './travelers.dto.js';

@Injectable()
export class TravelerRepository {
  constructor(
    @InjectRepository(TravelerEntity)
    private readonly repo: Repository<TravelerEntity>,
  ) {}

  async create(
    record: CreateTravelerDto,
    txn: EntityManager | null,
  ): Promise<TravelerDto> {
    const data = this.repo.create(record);

    if (txn) {
      return await txn.save(data);
    }

    return await this.repo.save(data);
  }

  async getByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<TravelerDto | null> {
    return await this.repo.findOneBy({ id, userId, deletedAt: IsNull() });
  }

  async getByUserId(userId: string): Promise<TravelerDto[]> {
    return await this.repo.findBy({ userId });
  }

  async delete(id: string, txn: EntityManager | null) {
    if (txn) {
      return await txn.update(
        TravelerEntity,
        { id },
        { deletedAt: new Date() },
      );
    }

    await this.repo.update({ id }, { deletedAt: new Date() });
  }
}
