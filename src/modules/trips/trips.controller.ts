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

  @Get('/destination/:slug')
  @ApiOkResponse({ type: PaginatedResponseDto })
  @ApiParam({ name: 'slug', type: 'string', example: 'india' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findAllByCountryName(
    @Res() res: Response,
    @Param('slug') slug: string,
    @Query() query: TripQueryDto,
  ) {
    slug = decodeURIComponent(slug);

    const data = await this.service.findByDestinationSlug(slug, query);

    return res.status(200).send(data);
  }

    @Get('/:slug')
    @ApiOkResponse({ type: TripDto })
    @ApiParam({ name: 'slug', type: 'string', example: 'darjeeling-queen-of-the-hills-budget' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiNotFoundResponse({ description: 'Not found' })
    async findBySlug(@Res() res: Response, @Param('slug') slug: string) {
      slug = decodeURIComponent(slug);

      const data = await this.service.findBySlugOrThrow(slug);

      return res.status(200).send(data);
    }
}
