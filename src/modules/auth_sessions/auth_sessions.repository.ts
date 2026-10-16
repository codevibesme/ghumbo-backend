import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthSessionEntity } from '../../entities/auth_sessions.entity.js';
import { EntityManager, IsNull, Raw, Repository } from 'typeorm';
import { AuthSessionDto, CreateAuthSessionDto } from './auth_sessions.dto.js';

@Injectable()
export class AuthSessionRepository {
  constructor(
    @InjectRepository(AuthSessionEntity)
    private readonly repo: Repository<AuthSessionEntity>,
  ) {}

  async create(
    data: CreateAuthSessionDto,
    txn: EntityManager | null,
  ): Promise<AuthSessionDto> {
    const record = this.repo.create(data);

    if (txn) {
      return await txn.save(record);
    }

    return await this.repo.save(record);
  }

  async findById(id: string): Promise<AuthSessionDto | null> {
    return await this.repo.findOneBy({ id });
  }

  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSessionDto | null> {
    return await this.repo.findOneBy({ refreshTokenHash });
  }

  async hasActiveSessions(userId: string): Promise<boolean> {
    return await this.repo
      .createQueryBuilder('auth_session')
      .where('auth_session.userId = :userId', { userId })
      .andWhere('auth_session.revokedAt IS NULL')
      .andWhere('auth_session.expiresAt > NOW()')
      .orderBy('auth_session.lastUsedAt', 'DESC')
      .getExists();
  }

  async rotateRefreshToken(
    id: string,
    oldHash: string,
    newHash: string,
  ): Promise<boolean> {
    const result = await this.repo.update(
      {
        id,
        refreshTokenHash: oldHash,
        revokedAt: IsNull(),
        expiresAt: Raw((column) => `${column} > NOW()`),
      },
      {
        refreshTokenHash: newHash,
        lastUsedAt: () => 'NOW()',
      },
    );

    if (result.affected !== 1) {
      return false;
    }

    return true;
  }

  async revokeSession(id: string): Promise<boolean> {
    const result = await this.repo.update(
      { id, revokedAt: IsNull() },
      { revokedAt: () => 'NOW()' },
    );

    if (result.affected !== 1) {
      return false;
    }

    return true;
  }
}
