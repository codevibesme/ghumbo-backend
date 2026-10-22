import { Injectable, NotFoundException } from '@nestjs/common';
import { TripRepository } from './trips.repository.js';
import { TripDto, TripListItemDto, TripQueryDto } from './trips.dto.js';
import { PaginatedResponseDto } from '../misc/dto.js';

@Injectable()
export class TripService {
  constructor(private readonly repo: TripRepository) {}

  async findByDestinationSlug(
    slug: string,
    query: TripQueryDto,
  ): Promise<PaginatedResponseDto<TripListItemDto>> {
    return await this.repo.findByDestinationSlug(slug, query);
  }

  async findBySlug(slug: string): Promise<TripDto | null> {
    return await this.repo.findBySlug(slug);
  }

  async findBySlugOrThrow(slug: string): Promise<TripDto> {
    const data = await this.findBySlug(slug);
    if (!data) throw new NotFoundException('Trip not found.');

    return data;
  }
}
