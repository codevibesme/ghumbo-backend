import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { type Response } from 'express';
import { TravelerService } from './travelers.service.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { CreateTravelerReqDto, TravelerDto } from './travelers.dto.js';
import { type AuthenticatedUserReq } from '../../interfaces/index.js';

@Controller('travelers')
@ApiTags('travelers')
export class TravelerController {
  constructor(private readonly service: TravelerService) {}

  @Get('/user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({ type: TravelerDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async getByUserId(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Param('userId') userId: string,
  ) {
    if (!userId) {
      throw new UnprocessableEntityException('userId is required');
    }

    const data = await this.service.getByUserId(req.user.userId);

    return res.status(200).send(data);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateTravelerReqDto })
  @ApiOkResponse({ type: TravelerDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async create(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Body() body: CreateTravelerReqDto,
  ) {
    const data = await this.service.create(
      {
        ...body,
        userId: req.user.userId,
      },
      null,
    );

    return res.status(200).send(data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Traveler deleted successfully' })
  @ApiNotFoundResponse({ description: 'Traveler not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiConflictResponse({ description: 'Traveler has already been deleted' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async delete(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    await this.service.delete(id, req.user.userId, null);

    return res.status(200).send('Traveler deleted successfully');
  }
}
