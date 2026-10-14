import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { UserEntity } from '../../entities/users.entity.js';

import { CreateUserDto, UpdateUserDto, UserDto } from './users.dto.js';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>,
  ) {}

  async create(
    data: CreateUserDto,
    txn: EntityManager | null,
  ): Promise<UserDto> {
    const record = this.repo.create(data);

    if (txn) return await txn.save(record);

    return await this.repo.save(record);
  }

  async findById(id: string): Promise<UserDto | null> {
    return await this.repo.findOneBy({ id });
  }

  async findByEmailOrPhone(
    email: string | null,
    phone: string | null,
  ): Promise<UserDto | null> {
    if (email) {
      return await this.repo.findOneBy({ email });
    } else if (phone) {
      return await this.repo.findOneBy({ phone });
    }

    return null;
  }

  async update(
    id: string,
    record: UpdateUserDto,
    txn: EntityManager | null,
  ): Promise<void> {
    if (txn) await txn.update(UserEntity, id, record);
    else await this.repo.update(id, record);
  }
}
