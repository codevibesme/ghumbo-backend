import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PaginatedResponseDto } from '../misc/dto.js';
import { DestinationDto, DestinationQueryDto } from './destinations.dto.js';
import { DestinationEntity } from '../../entities/destinations.entity.js';
import { EDestinationStatus } from '../../schemas/destinations.schema.js';

@Injectable()
export class DestinationRepository {
  constructor(
    @InjectRepository(DestinationEntity)
    private readonly repo: Repository<DestinationEntity>,
  ) {}

  async findAllByCountryId(
    countryId: number,
    query: DestinationQueryDto,
  ): Promise<PaginatedResponseDto<DestinationDto>> {
    let page = query.page ?? 1;
    let size = query.size ?? 10;

    const [destinations, count] = await this.repo.findAndCount({
      where: {
        countryId,
        ...(query.name ? { name: ILike(`%${query.name}%`) } : {}),
        ...(query.status
          ? { status: query.status }
          : { status: EDestinationStatus.LIVE }),
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      page,
      size: destinations.length,
      data: destinations,
      total: count,
      hasNext: page * size < count,
      hasPrev: page > 1 && count > 0,
    };
  }

  async findById(id: number): Promise<DestinationDto | null> {
    return await this.repo.findOneBy({ id });
  }

  async findBySlug(slug: string): Promise<DestinationDto | null> {
    return await this.repo.findOneBy({ slug });
  }
}
