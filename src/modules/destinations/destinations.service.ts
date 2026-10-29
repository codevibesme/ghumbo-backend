import { Injectable, NotFoundException } from '@nestjs/common';
import { DestinationRepository } from './destinations.repository.js';
import { DestinationDto, DestinationQueryDto } from './destinations.dto.js';
import { PaginatedResponseDto } from '../misc/dto.js';
import { CountryService } from '../countries/countries.service.js';

@Injectable()
export class DestinationService {
  constructor(
    private readonly countryService: CountryService,
    private readonly repo: DestinationRepository,
  ) {}

  async findById(id: number): Promise<DestinationDto | null> {
    return await this.repo.findById(id);
  }

  async findByIdOrThrow(id: number): Promise<DestinationDto> {
    const data = await this.findById(id);
    if (!data) throw new NotFoundException('Not found');

    return data;
  }

  async findAll(
    query: DestinationQueryDto,
  ): Promise<PaginatedResponseDto<DestinationDto>> {
    if (query.country && !query.countryId) {
      const country = await this.countryService.findByNameOrThrow(
        decodeURIComponent(query.country),
      );
      query.countryId = country.id;
    }

    return await this.repo.findAll(query);
  }

  async findBySlug(slug: string): Promise<DestinationDto | null> {
    return await this.repo.findBySlug(slug);
  }

  async findBySlugOrThrow(slug: string): Promise<DestinationDto> {
    const data = await this.findBySlug(slug);
    if (!data) throw new NotFoundException('Not found');

    return data;
  }
}
