import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository, SelectQueryBuilder } from 'typeorm';

import { BookingEntity } from '../../entities/bookings.entity.js';
import {
  BookingDto,
  CreateBookingDto,
  UserBookingDto,
} from './bookings.dto.js';
import {
  EBookingRefundStatus,
  EBookingStatus,
} from '../../schemas/bookings.schema.js';
import { PaginatedResponseDto, PaginationReqDto } from '../misc/dto.js';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly repo: Repository<BookingEntity>,
  ) {}

  private buildUserBookingQuery(
    userId: string,
  ): SelectQueryBuilder<BookingEntity> {
    return this.repo
      .createQueryBuilder('b')
      .withDeleted()
      .innerJoin('b.departure', 'dept')
      .innerJoin('dept.trip', 'trip')
      .innerJoin('trip.destination', 'dest')
      .innerJoin('b.travelers', 'bt')
      .innerJoin('bt.traveler', 't')
      .select([
        'b.id',
        'b.code',
        'b.departureId',
        'b.status',
        'b.travelerCount',
        'b.currency',
        'b.amount',
        'b.expiresAt',
        'b.paymentCheckoutId',
        'b.paymentReferenceId',
        'b.refundStatus',
        'b.refundAmount',
        'b.refundReason',
        'b.error',
        'b.paymentMethod',
        'b.createdAt',
        'b.updatedAt',
        'bt.bookingId',
        'bt.travelerId',
        't.id',
        't.firstName',
        't.lastName',
        't.email',
        't.phone',
        't.dateOfBirth',
        't.gender',
        'trip.id',
        'trip.name',
        'trip.slug',
        'trip.assets',
        'dest.id',
        'dest.name',
        'dept.id',
        'dept.isPeak',
        'dept.startDate',
        'dept.endDate',
      ])
      .where('b.userId = :userId', { userId });
  }

  private toUserBooking(data: BookingDto): UserBookingDto {
    return {
      id: data.id,
      status: data.status,
      code: data.code,
      departureId: data.departureId,
      paymentCheckoutId: data.paymentCheckoutId,
      paymentReferenceId: data.paymentReferenceId,
      paymentMethod: data.paymentMethod,
      travelers: data.travelers.map((t) => ({
        id: t.traveler.id,
        firstName: t.traveler.firstName,
        lastName: t.traveler.lastName,
        phone: t.traveler.phone,
        email: t.traveler.email,
        gender: t.traveler.gender,
        dateOfBirth: t.traveler.dateOfBirth,
      })),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      travelerCount: data.travelerCount,
      tripName: data.departure.trip.name,
      tripSlug: data.departure.trip.slug,
      tripAsset: data.departure.trip.assets?.[0] ?? null,
      destinationName: data.departure.trip.destination.name,
      isPeak: data.departure.isPeak,
      startDate: data.departure.startDate,
      endDate: data.departure.endDate,
      currency: data.currency,
      amount: data.amount,
      refundStatus: data.refundStatus,
      refundAmount: data.refundAmount,
      refundReason: data.refundReason,
      expiresAt: data.expiresAt,
      error: data.error,
    };
  }

  async create(
    record: CreateBookingDto,
    txn: EntityManager | null,
  ): Promise<BookingDto> {
    const data = this.repo.create(record);
    if (txn) {
      return await txn.save(data);
    }

    return await this.repo.save(data);
  }

  async getById(id: string): Promise<BookingDto | null> {
    return await this.repo.findOneBy({ id });
  }

  async getActiveBooking(
    userId: string,
    departureId: string,
  ): Promise<BookingDto | null> {
    return await this.repo.findOneBy({
      userId,
      departureId,
      status: In([EBookingStatus.PENDING]),
    });
  }

  async updatePaymentCheckoutId(id: string, orderId: string) {
    return await this.repo.update({ id }, { paymentCheckoutId: orderId });
  }

  async updateBookingConfirmed(
    orderId: string,
    paymentId: string,
    paymentMethod: string,
  ) {
    return await this.repo.update(
      { paymentCheckoutId: orderId, status: EBookingStatus.PENDING },
      {
        status: EBookingStatus.CONFIRMED,
        paymentReferenceId: paymentId,
        paymentMethod: paymentMethod,
      },
    );
  }

  async getByPaymentCheckoutId(
    paymentCheckoutId: string,
  ): Promise<BookingDto | null> {
    return await this.repo.findOneBy({ paymentCheckoutId });
  }

  async setRefundDetails(
    paymentId: string,
    refundId: string,
    status: EBookingRefundStatus,
  ) {
    return await this.repo.update(
      {
        paymentReferenceId: paymentId,
      },
      {
        paymentRefundId: refundId,
        refundStatus: status,
      },
    );
  }

  async setPaymentRefundId(bookingId: string, refundId: string) {
    return this.repo.update({ id: bookingId }, { paymentRefundId: refundId });
  }

  async getStaleBookings(pageParams: PaginationReqDto): Promise<string[]> {
    const page = pageParams?.page ?? 1;
    const size = pageParams?.size ?? 100;

    const data = await this.repo
      .createQueryBuilder('booking')
      .select('booking.id')
      .where('booking.status = :status', { status: EBookingStatus.PENDING })
      .andWhere("booking.expiresAt < NOW() - interval '2 minutes' ")
      .orderBy('booking.expiresAt', 'ASC')
      .skip((page - 1) * size)
      .take(size)
      .getMany();

    return data.map((booking) => booking.id);
  }

  async findUserBookings(
    userId: string,
    pageParams: PaginationReqDto,
  ): Promise<PaginatedResponseDto<UserBookingDto>> {
    const page = pageParams.page ?? 1;
    const size = pageParams.size ?? 10;

    const [res, count] = await this.buildUserBookingQuery(userId)
      .skip((page - 1) * size)
      .take(size)
      .orderBy('b.createdAt', 'DESC')
      .getManyAndCount();

    const result: UserBookingDto[] = res.map((row) => this.toUserBooking(row));

    return {
      page,
      size,
      data: result,
      total: count,
      hasNext: page * size < count,
      hasPrev: page > 1 && count > 0,
    };
  }

  async findUserBooking(
    userId: string,
    bookingId: string,
  ): Promise<UserBookingDto | null> {
    const booking = await this.buildUserBookingQuery(userId)
      .andWhere('b.id = :id', { id: bookingId })
      .getOne();

    if (!booking) return null;

    return this.toUserBooking(booking);
  }
}
