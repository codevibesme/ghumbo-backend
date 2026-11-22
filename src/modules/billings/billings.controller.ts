import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
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
import type { AuthenticatedUserReq } from '../../interfaces/index.js';
import type { Response } from 'express';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import {
  CancelBookingReqDto,
  CancelBookingResDto,
  CancelQuoteResDto,
  CreateBookingReqDto,
  CreateBookingResDto,
} from './billings.dto.js';
import { BillingService } from './billings.service.js';

@Controller('billings')
@ApiTags('billings')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateBookingReqDto })
  @ApiOkResponse({ type: CreateBookingResDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({
    description:
      'An active booking is already in progress/Trip is fully booked. Please try some other date!',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createBooking(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Body() body: CreateBookingReqDto,
  ) {
    const data = await this.service.createBooking(req.user.userId, body);

    return res.status(200).send(data);
  }

  @Post('/retry-payment/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'bookingId', type: String })
  @ApiOkResponse({ type: CreateBookingResDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({
    description: 'Booking has already expired',
  })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async retryBooking(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Param('bookingId') bookingId: string,
  ) {
    const data = await this.service.retryPayment(bookingId, req.user.userId);

    return res.status(200).send(data);
  }

  @Post('/bookings/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: CancelBookingResDto })
  @ApiBody({ type: CancelBookingReqDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({
    description: 'Booking is not in a cancellable state',
  })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async cancelBooking(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Body() body: CancelBookingReqDto,
  ) {
    const data = await this.service.cancelBooking(req.user.userId, body);

    return res.status(200).send(data);
  }
  @Get('/bookings/cancel/quote/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: CancelQuoteResDto })
  @ApiParam({ name: 'bookingId', type: String })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({
    description: 'Cannot cancel unconfirmed booking',
  })
  @ApiNotFoundResponse({
    description: 'Booking not found/Trip departure not found',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getCancellationQuote(
    @Req() req: AuthenticatedUserReq,
    @Res() res: Response,
    @Param('bookingId') bookingId: string,
  ) {
    const data = await this.service.getCancellationQuote(
      req.user.userId,
      bookingId,
    );

    return res.status(200).send(data);
  }
}
