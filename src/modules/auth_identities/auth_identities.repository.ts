import { Injectable } from '@nestjs/common';
import {
  AuthIdentityDto,
  CreateAuthIdentityDto,
} from './auth_identities.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthIdentityEntity } from '../../entities/auth_identities.entity.js';
import { EntityManager, Repository } from 'typeorm';
import { EAuthIdentityProvider } from '../../schemas/auth_identities.schema.js';

@Injectable()
export class AuthIdentityRepository {
  constructor(
    @InjectRepository(AuthIdentityEntity)
    private readonly repo: Repository<AuthIdentityEntity>,
  ) {}

  async create(
    data: CreateAuthIdentityDto,
    txn: EntityManager | null,
  ): Promise<AuthIdentityDto> {
    const record = this.repo.create(data);
    if (txn) {
      return await txn.save(record);
    }

    return await this.repo.save(record);
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: EAuthIdentityProvider,
  ): Promise<AuthIdentityDto | null> {
    return await this.repo.findOneBy({ userId, provider });
  }

  async findByProviderAndProviderUserId(
    provider: EAuthIdentityProvider,
    providerUserId: string,
  ): Promise<AuthIdentityDto | null> {
    return await this.repo.findOneBy({ provider, providerUserId });
  }
}
