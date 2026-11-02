import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedResponseDto } from '../misc/dto.js';
import { DestinationDto, DestinationQueryDto } from './destinations.dto.js';
import { DestinationService } from './destinations.service.js';

@Controller('destinations')
@ApiTags('destinations')
export class DestinationController {
  constructor(private readonly service: DestinationService) {}

  @Get('/')
  @ApiOkResponse({ type: PaginatedResponseDto<DestinationDto> })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findAll(@Res() res: Response, @Query() query: DestinationQueryDto) {
    const data = await this.service.findAll(query);

    return res.status(200).send(data);
  }

  @Get('/:slug')
  @ApiOkResponse({ type: DestinationDto })
  @ApiParam({ name: 'slug', type: 'string', example: 'west-bengal' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findAllBySlug(@Res() res: Response, @Param('slug') slug: string) {
    slug = decodeURIComponent(slug);

    const data = await this.service.findBySlugOrThrow(slug);

    return res.status(200).send(data);
  }
}
