import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthenticatedUserReq, OptionalAuthenticatedUserReq } from '../../interfaces/index.js';
import {
  BookingRequestDto,
  CreateBookingRequestDto,
  CreateBookingRequestReqDto,
  UserBookingRequestDto,
} from './booking_requests.dto.js';
import { BookingRequestService } from './booking_requests.service.js';
import { PaginatedResponseDto, PaginationReqDto } from '../misc/dto.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { OptionalAuthGuard } from '../authentication/guards/optional-jwt-auth.guard.js';

@Controller('booking-requests')
@ApiTags('booking-requests')
export class BookingRequestController {
  constructor(private readonly service: BookingRequestService) {}

  @Post()
  @UseGuards(OptionalAuthGuard)
  @ApiBody({ type: CreateBookingRequestReqDto })
  @ApiOkResponse({ type: BookingRequestDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async create(@Req() req: OptionalAuthenticatedUserReq, @Res() res: Response, @Body() body: CreateBookingRequestReqDto) {
    const paylaod: CreateBookingRequestDto = {
      ...body,
      userId: null
    };

    if(req.user) {
      paylaod.userId = req.user.userId;  
    }

    const data = await this.service.create(paylaod, null);

    return res.status(200).send(data);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({ type: PaginationReqDto })
  @ApiOkResponse({ type: PaginatedResponseDto<UserBookingRequestDto>})
  @ApiNotFoundResponse({ description: "Not found" })
  @ApiBadRequestResponse({ description: "Bad request" })
  async findUserBookings(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Query() pageParams: PaginationReqDto,
  ) {
    const data = await this.service.findUserBookings(
      req.user.userId,
      pageParams,
    );

    return res.status(200).json(data);
  }

  @Get("/:code")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ type: String, name: 'code' })
  @ApiOkResponse({ type: UserBookingRequestDto })
  @ApiNotFoundResponse({ description: 'Not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async findByCode(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Param('code') code: string
  ) {
    const data = await this.service.findByCodeOrThrow(
      req.user.userId,
      code
    );

    return res.status(200).json(data);
  }

  @Patch("/withdraw/:code")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ type: String, name: 'code' })
  @ApiOkResponse({ description: "Withdrawn sucessfully." })
  @ApiNotFoundResponse({ description: 'Not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async withdraw(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Param('code') code: string
  ) {
    await this.service.withdraw(
      req.user.userId,
      code
    );

    return res.status(200).json("Withdrawn successfully.");
  }
}
