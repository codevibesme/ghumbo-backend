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

  @Get('/country/:countryName')
  @ApiOkResponse({ type: PaginatedResponseDto<DestinationDto> })
  @ApiParam({ name: 'countryName', type: 'string', example: 'india' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Not found' })
  async findAllByCountryName(
    @Res() res: Response,
    @Param('countryName') countryName: string,
    @Query() query: DestinationQueryDto,
  ) {
    countryName = decodeURIComponent(countryName);

    const data = await this.service.findAllByCountryName(countryName, query);

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
