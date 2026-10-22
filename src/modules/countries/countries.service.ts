import { Injectable, NotFoundException } from '@nestjs/common';
import { CountryRepository } from './countries.repository.js';
import { CountryDto, CountryQueryDto } from './countries.dto.js';
import { PaginatedResponseDto } from '../misc/dto.js';

@Injectable()
export class CountryService {
  constructor(private readonly repo: CountryRepository) {}

  async findAll(
    query: CountryQueryDto,
  ): Promise<PaginatedResponseDto<CountryDto>> {
    return await this.repo.findAll(query);
  }

  async findByName(name: string): Promise<CountryDto | null> {
    return await this.repo.findByName(name);
  }

  async findByNameOrThrow(name: string): Promise<CountryDto> {
    const data = await this.repo.findByName(name);

    if (!data) {
      throw new NotFoundException('Country not found.');
    }

    return data;
  }
}
