import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TripService } from './trips.service.js';
import { TripDto, TripQueryDto } from './trips.dto.js';
import { PaginatedResponseDto } from '../misc/dto.js';

@Controller('trips')
@ApiTags('trips')
export class TripController {
  constructor(private readonly service: TripService) {}

  @Get('/')
  @ApiOkResponse({ type: PaginatedResponseDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findAll(@Res() res: Response, @Query() query: TripQueryDto) {
    const data = await this.service.findAll(query);

    return res.status(200).send(data);
  }

  @Get('/:slug')
  @ApiOkResponse({ type: TripDto })
  @ApiParam({
    name: 'slug',
    type: 'string',
    example: 'darjeeling-queen-of-the-hills-budget',
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findBySlug(@Res() res: Response, @Param('slug') slug: string) {
    slug = decodeURIComponent(slug);

    const data = await this.service.findBySlugOrThrow(slug);

    return res.status(200).send(data);
  }
}
