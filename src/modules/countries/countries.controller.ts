import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CountryService } from './countries.service.js';
import { CountryDto, CountryQueryDto } from './countries.dto.js';
import type { Response } from 'express';
import { PaginatedResponseDto } from '../misc/dto.js';

@Controller('countries')
@ApiTags('countries')
export class CountryController {
  constructor(private readonly service: CountryService) {}

  @Get('/')
  @ApiOkResponse({ type: PaginatedResponseDto<CountryDto> })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async findAll(@Res() res: Response, @Query() query: CountryQueryDto) {
    const data = await this.service.findAll(query);

    return res.status(200).send(data);
  }

  @Get('/:name')
  @ApiParam({ name: 'name', type: 'string', description: 'india' })
  @ApiOkResponse({ type: CountryDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findByName(@Res() res: Response, @Param('name') name: string) {
    name = decodeURIComponent(name);

    const data = await this.service.findByNameOrThrow(name);

    return res.status(200).send(data);
  }
}
