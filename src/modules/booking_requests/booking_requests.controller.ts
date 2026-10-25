import { Body, Controller, Post, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  BookingRequestDto,
  CreateBookingRequestDto,
} from './booking_requests.dto.js';
import { BookingRequestService } from './booking_requests.service.js';

@Controller('booking-requests')
@ApiTags('booking-requests')
export class BookingRequestController {
  constructor(private readonly service: BookingRequestService) {}

  @Post()
  @ApiBody({ type: CreateBookingRequestDto })
  @ApiOkResponse({ type: BookingRequestDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async create(@Res() res: Response, @Body() body: CreateBookingRequestDto) {
    const data = await this.service.create(body, null);

    return res.status(200).send(data);
  }
}
