import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AuthIdentityDto,
  CreateAuthIdentityDto,
} from './auth_identities.dto.js';
import { EntityManager } from 'typeorm';
import { AuthIdentityRepository } from './auth_identities.repository.js';
import { EAuthIdentityProvider } from '../../schemas/auth_identities.schema.js';

@Injectable()
export class AuthIdentityService {
  constructor(private readonly repo: AuthIdentityRepository) {}

  async create(
    data: CreateAuthIdentityDto,
    txn: EntityManager | null,
  ): Promise<AuthIdentityDto> {
    return await this.repo.create(data, txn);
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: EAuthIdentityProvider,
  ): Promise<AuthIdentityDto | null> {
    return await this.repo.findByUserIdAndProvider(userId, provider);
  }

  async findByUserIdAndProviderOrThrow(
    userId: string,
    provider: EAuthIdentityProvider,
  ): Promise<AuthIdentityDto> {
    const data = await this.repo.findByUserIdAndProvider(userId, provider);
    if (!data) {
      throw new NotFoundException('Auth Identity Provider not found.');
    }

    return data;
  }

  async findByProviderAndProviderUserId(
    provider: EAuthIdentityProvider,
    providerUserId: string,
  ): Promise<AuthIdentityDto | null> {
    return await this.repo.findByProviderAndProviderUserId(
      provider,
      providerUserId,
    );
  }

  async findByProviderAndProviderUserIdOrThrow(
    provider: EAuthIdentityProvider,
    providerUserId: string,
  ): Promise<AuthIdentityDto> {
    const data = await this.repo.findByProviderAndProviderUserId(
      provider,
      providerUserId,
    );
    if (!data) {
      throw new NotFoundException('Auth Identity Provider not found.');
    }

    return data;
  }
}
