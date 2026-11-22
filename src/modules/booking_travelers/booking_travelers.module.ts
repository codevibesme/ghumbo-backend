import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingTravelerEntity } from '../../entities/booking_travelers.entity.js';
import { BookingTravelerService } from './booking_travlers.service.js';
import { BookingTravelerRepository } from './booking_travelers.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([BookingTravelerEntity])],
  providers: [BookingTravelerService, BookingTravelerRepository],
  exports: [BookingTravelerService],
})
export class BookingTravelerModule {}
