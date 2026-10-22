import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CountryEntity } from '../../entities/countries.entity.js';
import { ILike, Repository } from 'typeorm';
import { CountryDto, CountryQueryDto } from './countries.dto.js';
import { ECountryStatus } from '../../schemas/countries.schema.js';
import { PaginatedResponseDto } from '../misc/dto.js';

@Injectable()
export class CountryRepository {
  constructor(
    @InjectRepository(CountryEntity)
    private readonly repo: Repository<CountryEntity>,
  ) {}

  async findAll(
    query: CountryQueryDto,
  ): Promise<PaginatedResponseDto<CountryDto>> {
    let page = query.page ?? 1;
    let size = query.size ?? 10;

    const res = await this.repo.findAndCount({
      where: {
        ...(query.name ? { name: ILike(`%${query.name}%`) } : {}),
        ...(query.status
          ? { status: query.status }
          : { status: ECountryStatus.LIVE }),
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * size,
      take: size,
    });

    const [countries, count] = res;

    return {
      page,
      size,
      data: countries,
      total: count,
      hasNext: page * size < count,
      hasPrev: page > 1 && count > 0,
    };
  }

  async findByName(name: string): Promise<CountryDto | null> {
    return await this.repo.findOneBy({ name: ILike(name) });
  }
}
