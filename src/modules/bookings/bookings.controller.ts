import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BookingService } from './bookings.service.js';
import { UserBookingDto } from './bookings.dto.js';
import { PaginatedResponseDto, PaginationReqDto } from '../misc/dto.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { type AuthenticatedUserReq } from '../../interfaces/index.js';
import { type Response } from 'express';

@Controller('bookings')
@ApiTags('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({ type: PaginationReqDto })
  @ApiOkResponse({ type: PaginatedResponseDto<UserBookingDto> })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async findUserBookings(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Query() pageParams: PaginationReqDto,
  ) {
    const result = await this.bookingService.findUserBookings(
      req.user.userId,
      pageParams,
    );

    return res.status(200).send(result);
  }

  @Get('/details/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'bookingId', type: String, required: true })
  @ApiOkResponse({ type: UserBookingDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async findUserBooking(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Param('bookingId') bookingId: string,
  ) {
    const result = await this.bookingService.findUserBookingOrThrow(
      req.user.userId,
      bookingId,
    );

    return res.status(200).send(result);
  }
}
