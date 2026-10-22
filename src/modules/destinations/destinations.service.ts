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

  async findAllByCountryId(
    countryId: number,
    query: DestinationQueryDto,
  ): Promise<PaginatedResponseDto<DestinationDto>> {
    return await this.repo.findAllByCountryId(countryId, query);
  }

  async findById(id: number): Promise<DestinationDto | null> {
    return await this.repo.findById(id);
  }

  async findByIdOrThrow(id: number): Promise<DestinationDto> {
    const data = await this.findById(id);
    if (!data) throw new NotFoundException('Not found');

    return data;
  }

  async findAllByCountryName(
    countryName: string,
    query: DestinationQueryDto,
  ): Promise<PaginatedResponseDto<DestinationDto>> {
    const country = await this.countryService.findByNameOrThrow(countryName);

    return await this.findAllByCountryId(country.id, query);
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
