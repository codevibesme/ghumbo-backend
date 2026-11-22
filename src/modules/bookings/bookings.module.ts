import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from '../../entities/bookings.entity.js';
import { BookingService } from './bookings.service.js';
import { BookingRepository } from './booking.repository.js';
import { BookingController } from './bookings.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity])],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService],
})
export class BookingModule {}
