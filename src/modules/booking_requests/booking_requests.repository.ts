import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookingRequestEntity } from '../../entities/booking_requests.entity.js';
import { EntityManager, In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import {
  BookingRequestDto,
  CreateBookingRequestDto,
  UserBookingRequestDto,
} from './booking_requests.dto.js';
import { PaginatedResponseDto, PaginationReqDto } from '../misc/dto.js';
import { EBookingRequestStatus } from '../../schemas/booking_requests.schema.js';

@Injectable()
export class BookingRequestRepository {
  constructor(
    @InjectRepository(BookingRequestEntity)
    private readonly repo: Repository<BookingRequestEntity>,
  ) {}

  private toUserBookingRequest(data: BookingRequestDto): UserBookingRequestDto {
    return {
      id: data.id,
      tripDepartureId: data.tripDepartureId,
      status: data.status,
      statusNotes: data.statusNotes,
      code: data.code,
      name: data.name,
      email: data.email,
      phone: data.phone,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      travelerCount: data.travelerCount,
      tripName: data.departure.trip.name,
      destinationName: data.departure.trip.destination.name,
      startDate: data.departure.startDate,
      endDate: data.departure.endDate,
      currency: data.departure.currency,
      estimate: String(Number(data.departure.amount) * data.travelerCount),
    }
  }

  private buildUserBookingRequestQuery(userId: string): SelectQueryBuilder<BookingRequestEntity> {
    return this.repo
      .createQueryBuilder('br')
      .innerJoin('br.departure', 'dept')
      .innerJoin('dept.trip', 'trip')
      .innerJoin('trip.destination', 'dest')
      .select([
        'br.id',
        'br.tripDepartureId',
        'br.status',
        'br.statusNotes',
        'br.code',
        'br.name',
        'br.email',
        'br.phone',
        'br.createdAt',
        'br.updatedAt',
        'br.travelerCount',
        'trip.name',
        'dest.name',
        'dept.startDate',
        'dept.endDate',
        'dept.currency',
        'dept.amount',
      ])
      .where('br.userId = :userId', { userId })
  }

  async create(
    data: CreateBookingRequestDto,
    txn: EntityManager | null,
  ): Promise<BookingRequestDto> {
    const record = this.repo.create(data);

    if (txn) {
      return await txn.save(record);
    }

    return await this.repo.save(record);
  }

  async findUserBookings(
    userId: string,
    pageParams: PaginationReqDto,
  ): Promise<PaginatedResponseDto<UserBookingRequestDto>> {
    const page = pageParams.page ?? 1;
    const size = pageParams.size ?? 10;

    const [res, count] = await this.buildUserBookingRequestQuery(userId)
      .skip((page - 1) * size)
      .take(size)
      .orderBy('br.createdAt', 'DESC')
      .getManyAndCount();

    const result: UserBookingRequestDto[] = res.map((row) => this.toUserBookingRequest(row));

    return {
      page,
      size,
      data: result,
      total: count,
      hasNext: page * size < count,
      hasPrev: page > 1 && count > 0,
    };
  }

  async findByUserIdAndCode(
    userId: string,
    code: string
  ): Promise<UserBookingRequestDto | null> {
    const res =  await this.buildUserBookingRequestQuery(userId)
      .andWhere('br.code = :code', { code })
      .getOne();

    if(!res) return null;

    return this.toUserBookingRequest(res);
  }
  
  async withdraw(
    userId: string,
    code: string
  ): Promise<void> {
    const res = await this.repo.update({ userId, code, status: Not(In([EBookingRequestStatus.WITHDRAWN, EBookingRequestStatus.CONVERTED, EBookingRequestStatus.CLOSED])) }, {status: EBookingRequestStatus.WITHDRAWN})
    if(res.affected === 1) {
      return;
    }

    throw new BadRequestException("Failed to withdrawn: Might be withdrawn, or not found");
  }
}
