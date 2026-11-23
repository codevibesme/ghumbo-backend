import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BookingDto,
  CreateBookingDto,
  UserBookingDto,
} from './bookings.dto.js';
import { BookingRepository } from './booking.repository.js';
import { EntityManager } from 'typeorm';
import { EBookingRefundStatus } from '../../schemas/bookings.schema.js';
import { PaginatedResponseDto, PaginationReqDto } from '../misc/dto.js';

@Injectable()
export class BookingService {
  constructor(private readonly repo: BookingRepository) {}

  async create(
    record: CreateBookingDto,
    txn: EntityManager | null,
  ): Promise<BookingDto> {
    return await this.repo.create(record, txn);
  }

  async getById(id: string): Promise<BookingDto | null> {
    return await this.repo.getById(id);
  }

  async getByIdOrThrow(id: string): Promise<BookingDto> {
    const data = await this.getById(id);
    if (!data) throw new NotFoundException('Booking not found');

    return data;
  }

  async getActiveBooking(
    userId: string,
    departureId: string,
  ): Promise<BookingDto | null> {
    return await this.repo.getActiveBooking(userId, departureId);
  }

  async updatePaymentCheckoutId(id: string, orderId: string) {
    return await this.repo.updatePaymentCheckoutId(id, orderId);
  }

  async updateBookingConfirmed(
    orderId: string,
    paymentId: string,
    paymentMethod: string,
  ) {
    return await this.repo.updateBookingConfirmed(
      orderId,
      paymentId,
      paymentMethod,
    );
  }

  async getByPaymentCheckoutId(
    paymentCheckoutId: string,
  ): Promise<BookingDto | null> {
    return await this.repo.getByPaymentCheckoutId(paymentCheckoutId);
  }

  async setRefundDetails(
    paymentId: string,
    refundId: string,
    status: EBookingRefundStatus,
  ) {
    return await this.repo.setRefundDetails(paymentId, refundId, status);
  }

  async setPaymentRefundId(bookingId: string, refundId: string) {
    return await this.repo.setPaymentRefundId(bookingId, refundId);
  }

  async getStaleBookings(pageParams: PaginationReqDto): Promise<string[]> {
    return await this.repo.getStaleBookings(pageParams);
  }

  async getOrphanRefunds(pageParams: PaginationReqDto): Promise<BookingDto[]> {
    return await this.repo.getOrphanRefunds(pageParams);
  }

  async findUserBookings(
    userId: string,
    pageParams: PaginationReqDto,
  ): Promise<PaginatedResponseDto<UserBookingDto>> {
    return await this.repo.findUserBookings(userId, pageParams);
  }

  async findUserBooking(
    userId: string,
    bookingId: string,
  ): Promise<UserBookingDto | null> {
    return await this.repo.findUserBooking(userId, bookingId);
  }

  async findUserBookingOrThrow(
    userId: string,
    bookingId: string,
  ): Promise<UserBookingDto> {
    const data = await this.findUserBooking(userId, bookingId);
    if (!data) throw new NotFoundException('Booking details not found');

    return data;
  }
}
