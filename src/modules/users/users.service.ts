import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UserRepository } from './users.repository.js';
import {
  CreateUserDto,
  UpdateUserDto,
  UserDetailsDto,
  UserDto,
} from './users.dto.js';

@Injectable()
export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async create(
    record: CreateUserDto,
    txn: EntityManager | null,
  ): Promise<UserDto> {
    return await this.repo.create(record, txn);
  }

  async findById(id: string): Promise<UserDto | null> {
    return await this.repo.findById(id);
  }

  async findByIdOrThrow(id: string): Promise<UserDto> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found.');

    return user;
  }

  async getDetails(id: string): Promise<UserDetailsDto> {
    const user = await this.findByIdOrThrow(id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      photo: user.photo,
      createdAt: user.createdAt,
    };
  }

  async findByEmailOrPhone(
    email: string | null,
    phone: string | null,
  ): Promise<UserDto | null> {
    if (!email && !phone)
      throw new UnprocessableEntityException('Email or phone is required.');

    return await this.repo.findByEmailOrPhone(email, phone);
  }

  async findByEmailOrPhoneOrThrow(
    email: string | null,
    phone: string | null,
  ): Promise<UserDto> {
    if (!email && !phone)
      throw new UnprocessableEntityException('Email or phone is required.');

    const data = await this.repo.findByEmailOrPhone(email, phone);
    if (!data) {
      throw new NotFoundException('User not found.');
    }

    return data;
  }

  async update(
    id: string,
    record: UpdateUserDto,
    txn: EntityManager | null,
  ): Promise<void> {
    await this.repo.update(id, record, txn);
  }
}
