import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingRequestEntity } from '../../entities/booking_requests.entity.js';
import { BookingRequestController } from './booking_requests.controller.js';
import { BookingRequestService } from './booking_requests.service.js';
import { BookingRequestRepository } from './booking_requests.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([BookingRequestEntity])],
  controllers: [BookingRequestController],
  providers: [BookingRequestService, BookingRequestRepository],
  exports: [BookingRequestService],
})
export class BookingRequestModule {}
